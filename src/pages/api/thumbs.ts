import { exec } from 'child_process';
import crypto from 'crypto';
// import { exiftool } from 'exiftool-vendored'; // Désactivé pour optimisation
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const thumbDir = process.env.THUMB_DIR || '';

// Support des dossiers multiples
const getMediaDirs = (): string[] => {
  const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
  return mediaDirs
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
};

// Fonction pour créer un identifiant unique basé sur le chemin et le dossier source
function getFileId(relativePath: string, sourceDir: string): string {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
}

// Fonction pour scanner récursivement tous les fichiers
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);

    // Exclure les bibliothèques Photos et autres dossiers système
    if (file.endsWith('.photoslibrary') || file.startsWith('.')) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      // Récursion dans les sous-dossiers
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function getVideoDuration(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    );
    const seconds = parseFloat(stdout.trim());
    if (isNaN(seconds)) return null;

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } catch {
    return null;
  }
}

// Fonction désactivée pour optimisation des performances
// On utilise maintenant les stats du filesystem plutôt que l'EXIF
// Décommentez si vous avez besoin des dates EXIF précises
/*
async function getMediaCreationDate(filePath: string): Promise<Date | null> {
  try {
    const metadata = await exiftool.read(filePath);

    // Essayer différentes balises EXIF pour la date de création
    // Pour les photos : DateTimeOriginal, CreateDate, DateCreated
    // Pour les vidéos : CreationDate, MediaCreateDate, TrackCreateDate
    const dateCandidate =
      metadata.DateTimeOriginal ||
      metadata.CreateDate ||
      metadata.CreationDate ||
      metadata.MediaCreateDate ||
      metadata.TrackCreateDate ||
      metadata.DateCreated ||
      metadata.ModifyDate;

    if (dateCandidate) {
      // exiftool-vendored peut retourner des objets Date, ExifDateTime, ExifDate ou des strings
      if (dateCandidate instanceof Date) {
        return dateCandidate;
      }
      // ExifDateTime et ExifDate ont une méthode toDate()
      if (typeof dateCandidate === 'object' && 'toDate' in dateCandidate) {
        const date = (dateCandidate as { toDate: () => Date }).toDate();
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Sinon, essayer de parser comme string
      if (typeof dateCandidate === 'string' || typeof dateCandidate === 'number') {
        const date = new Date(dateCandidate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return null;
  } catch (error) {
    console.warn(`Failed to read EXIF for ${filePath}:`, error);
    return null;
  }
}
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mediaDirs = getMediaDirs();

  if (!thumbDir || mediaDirs.length === 0) {
    return res.status(500).json({ error: 'THUMB_DIR or MEDIA_DIRS not set' });
  }

  const startTime = Date.now();

  // Paramètres de pagination
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  // Scanner récursivement tous les fichiers de tous les dossiers
  const allMediaFiles: Array<{ filePath: string; sourceDir: string }> = [];

  for (const mediaDir of mediaDirs) {
    if (!fs.existsSync(mediaDir)) {
      console.warn(`Directory does not exist: ${mediaDir}`);
      continue;
    }

    const allFiles = getAllFiles(mediaDir);

    // Filtrer d'abord pour éviter les traitements inutiles
    const mediaFilesInDir = allFiles
      .filter((filePath) => {
        const fileName = path.basename(filePath);
        return /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(fileName);
      })
      .map((filePath) => ({ filePath, sourceDir: mediaDir }));

    allMediaFiles.push(...mediaFilesInDir);
  }

  console.log(
    `[thumbs] ${allMediaFiles.length} fichiers médias trouvés en ${Date.now() - startTime}ms`,
  );
  console.log(`[thumbs] Chargement de ${limit} médias à partir de ${offset}`);

  // Optimisation: On ne fait pas de tri global coûteux
  // On pagine d'abord, puis on trie seulement la page demandée
  // Cela permet un chargement initial ultra rapide

  // Paginer les fichiers
  const paginatedFiles = allMediaFiles.slice(offset, offset + limit);
  const totalCount = allMediaFiles.length;
  const hasMore = offset + limit < totalCount;

  // Traiter les fichiers par lots pour éviter de surcharger le système
  const BATCH_SIZE = 50;
  const thumbs: Array<{
    file: string;
    fileId: string;
    thumb: string;
    type: string;
    duration: string | null;
    thumbReady: boolean;
    createdAt: string;
  }> = [];

  for (let i = 0; i < paginatedFiles.length; i += BATCH_SIZE) {
    const batch = paginatedFiles.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ filePath, sourceDir }) => {
        const fileName = path.basename(filePath);
        const isVideo = /\.(mp4|mov|avi|mkv|hevc)$/i.test(fileName);

        // Créer un identifiant unique basé sur le chemin relatif et le dossier source
        const relativePath = path.relative(sourceDir, filePath);
        const fileId = getFileId(relativePath, sourceDir);
        const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
        const thumbReady = fs.existsSync(thumbPath);

        // Optimisation: ne lire les stats qu'une seule fois
        const stats = fs.statSync(filePath);

        // Optimisation critique: ne récupérer la durée et EXIF QUE si nécessaire
        // Pour accélérer le chargement initial, on utilise juste les stats du fichier
        let duration: string | null = null;
        const createdDate =
          stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;

        // Seulement charger les métadonnées EXIF si c'est une vidéo avec thumb prêt
        // (pour la durée) ou si on veut vraiment la date précise
        if (thumbReady && isVideo) {
          duration = await getVideoDuration(filePath);
        }

        // Option: désactiver totalement la lecture EXIF pour accélérer
        // Si vous voulez l'EXIF, décommentez les lignes suivantes:
        // if (thumbReady) {
        //   const exifDate = await getMediaCreationDate(filePath);
        //   if (exifDate) createdDate = exifDate;
        // }

        return {
          file: relativePath,
          fileId,
          thumb: `/thumbs/${fileId}.thumb.jpg`,
          type: isVideo ? 'video' : 'image',
          duration,
          thumbReady,
          createdAt: createdDate.toISOString(),
        };
      }),
    );
    thumbs.push(...batchResults);
  }

  console.log(`[thumbs] Traitement terminé en ${Date.now() - startTime}ms`);

  res.status(200).json({
    thumbs,
    total: totalCount,
    hasMore,
    offset,
    limit,
  });
}
