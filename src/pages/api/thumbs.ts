import { exec } from 'child_process';
import crypto from 'crypto';
import { exiftool } from 'exiftool-vendored';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const thumbDir = process.env.THUMB_DIR || '';
const mediaDir = process.env.MEDIA_DIR || '';

// Fonction pour créer un identifiant unique basé sur le chemin
function getFileId(relativePath: string): string {
  return crypto.createHash('sha256').update(relativePath).digest('hex').substring(0, 16);
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

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!thumbDir || !mediaDir) {
    return res.status(500).json({ error: 'THUMB_DIR or MEDIA_DIR not set' });
  }

  // Scanner récursivement tous les fichiers
  const allFiles = getAllFiles(mediaDir);

  const thumbsPromises = allFiles
    .filter((filePath) => {
      const fileName = path.basename(filePath);
      return /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(fileName);
    })
    .map(async (filePath) => {
      const fileName = path.basename(filePath);
      const isVideo = /\.(mp4|mov|avi|mkv|hevc)$/i.test(fileName);
      const duration = isVideo ? await getVideoDuration(filePath) : null;

      // Créer un identifiant unique basé sur le chemin relatif
      const relativePath = path.relative(mediaDir, filePath);
      const fileId = getFileId(relativePath);
      const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
      const thumbReady = fs.existsSync(thumbPath);
      const stats = fs.statSync(filePath);

      // Essayer d'obtenir la date de création depuis les métadonnées EXIF
      const exifDate = await getMediaCreationDate(filePath);
      const createdDate =
        exifDate || (stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime);

      return {
        file: relativePath, // Utiliser le chemin relatif pour identifier le fichier
        fileId, // Ajouter l'ID unique
        thumb: `/thumbs/${fileId}.thumb.jpg`,
        type: isVideo ? 'video' : 'image',
        duration,
        thumbReady,
        createdAt: createdDate.toISOString(),
      };
    });
  const thumbs = await Promise.all(thumbsPromises);

  res.status(200).json({ thumbs });
}
