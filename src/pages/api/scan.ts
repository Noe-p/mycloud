import { ScanState } from '@/types/Scan';
import crypto from 'crypto';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import sharp from 'sharp';

// Support des dossiers multiples
const getMediaDirs = (): string[] => {
  const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
  return mediaDirs
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
};

const thumbDir = process.env.THUMB_DIR || '';
const scanLockPath = path.join(process.cwd(), 'public', 'scan.lock');
const scanStatePath = path.join(process.cwd(), 'public', 'scan-state.json');

// Fonction pour créer un identifiant unique basé sur le chemin et le dossier source
function getFileId(relativePath: string, sourceDir: string): string {
  // Inclure le dossier source pour éviter les collisions entre différents dossiers
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

function isImage(file: string) {
  return /\.(jpg|jpeg|png|gif|heic)$/i.test(file);
}
function isVideo(file: string) {
  return /\.(mp4|mov|avi|mkv|hevc)$/i.test(file);
}
function isHeic(file: string) {
  return /\.heic$/i.test(file);
}

async function generateThumb(srcPath: string, destPath: string): Promise<void> {
  // Pour les images HEIC, utiliser ffmpeg (portable et dispo dans Docker)
  if (isHeic(srcPath)) {
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
      // Crop en carré 300x300 centré
      const cmd = `ffmpeg -y -i "${srcPath}" -vf "scale=300:300:force_original_aspect_ratio=increase,crop=300:300" "${destPath}"`;
      exec(cmd, (error) => {
        if (error) reject(error);
        else {
          console.log('Thumb HEIC généré:', destPath);
          resolve();
        }
      });
    });
  }
  // Pour les autres images - rotate() pour EXIF, resize + crop en carré 300x300
  await sharp(srcPath)
    .rotate()
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .toFile(destPath);
  // Les thumbs sont maintenant générés directement dans public/thumbs
  console.log('Thumb généré:', destPath);
}

async function generateVideoThumb(srcPath: string, destPath: string) {
  const { exec } = await import('child_process');
  return new Promise((resolve, reject) => {
    // Prend une frame à 1s et la crop en carré 300x300 centré
    const cmd = `ffmpeg -y -i "${srcPath}" -ss 00:00:01 -vframes 1 -vf "scale=300:300:force_original_aspect_ratio=increase,crop=300:300" "${destPath}"`;
    exec(cmd, (error) => {
      if (error) reject(error);
      else {
        // Copie dans public/thumbs
        const publicThumbs = path.join(process.cwd(), 'public', 'thumbs');
        if (!fs.existsSync(publicThumbs)) fs.mkdirSync(publicThumbs, { recursive: true });
        if (fs.existsSync(destPath)) {
          console.log('Thumb vidéo généré:', destPath);
        } else {
          console.error('Thumb vidéo source introuvable:', destPath);
        }
        resolve(true);
      }
    });
  });
}

// Fonction pour écrire l'état du scan
function writeScanState(state: {
  isScanning: boolean;
  progress: number;
  scanned: number;
  total: number;
  imagesCount: number;
  videosCount: number;
  deletedThumbs: number;
  startedAt?: string;
  completedAt?: string;
}) {
  try {
    fs.writeFileSync(scanStatePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Erreur écriture scan state:', e);
  }
}

// Fonction pour lire l'état du scan
function readScanState(): ScanState | null {
  try {
    if (fs.existsSync(scanStatePath)) {
      const content = fs.readFileSync(scanStatePath, 'utf-8');
      return JSON.parse(content) as ScanState;
    }
  } catch (e) {
    console.error('Erreur lecture scan state:', e);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Retourner l'état actuel du scan
  if (req.method === 'GET') {
    const state = readScanState();
    if (state) {
      return res.status(200).json(state);
    }
    return res.status(200).json({
      isScanning: false,
      progress: 0,
      scanned: 0,
      total: 0,
      imagesCount: 0,
      videosCount: 0,
      deletedThumbs: 0,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier si un scan est déjà en cours
  if (fs.existsSync(scanLockPath)) {
    const state = readScanState();
    return res.status(409).json({
      error: 'Scan already in progress',
      state,
    });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0 || !thumbDir) {
    return res.status(500).json({ error: 'MEDIA_DIRS or THUMB_DIR not set' });
  }

  // Créer le fichier lock
  try {
    fs.writeFileSync(scanLockPath, new Date().toISOString());
  } catch (e) {
    console.error('Erreur création lock:', e);
  }

  const startedAt = new Date().toISOString();

  try {
    // Scanner récursivement tous les fichiers de tous les dossiers
    const allMediaFiles: Array<{ filePath: string; sourceDir: string }> = [];

    for (const mediaDir of mediaDirs) {
      if (!fs.existsSync(mediaDir)) {
        console.warn(`Directory does not exist: ${mediaDir}`);
        continue;
      }

      const allFiles = getAllFiles(mediaDir);
      const mediaFilesInDir = allFiles
        .filter((filePath) => {
          const fileName = path.basename(filePath);
          return isImage(fileName) || isVideo(fileName);
        })
        .map((filePath) => ({ filePath, sourceDir: mediaDir }));

      allMediaFiles.push(...mediaFilesInDir);
    }

    // Créer un Set des fileIds valides pour comparaison rapide
    const validFileIds = new Set<string>();
    allMediaFiles.forEach(({ filePath, sourceDir }) => {
      const relativePath = path.relative(sourceDir, filePath);
      const fileId = getFileId(relativePath, sourceDir);
      validFileIds.add(fileId);
    });

    // Supprimer les thumbs orphelins (dont le média source n'existe plus)
    let deletedThumbs = 0;
    if (fs.existsSync(thumbDir)) {
      const thumbFiles = fs.readdirSync(thumbDir);
      for (const thumbFile of thumbFiles) {
        if (thumbFile.endsWith('.thumb.jpg')) {
          // Extraire le fileId du nom du thumb
          const fileId = thumbFile.replace('.thumb.jpg', '');
          // Si le fileId n'existe pas dans les médias valides, supprimer le thumb
          if (!validFileIds.has(fileId)) {
            const thumbPath = path.join(thumbDir, thumbFile);
            try {
              fs.unlinkSync(thumbPath);
              deletedThumbs++;
              console.log('Thumb orphelin supprimé:', thumbFile);
            } catch (e) {
              console.error('Erreur suppression thumb orphelin', thumbFile, ':', e);
            }
          }
        }
      }
    }

    const imagesCount = allMediaFiles.filter(({ filePath }) =>
      isImage(path.basename(filePath)),
    ).length;
    const videosCount = allMediaFiles.filter(({ filePath }) =>
      isVideo(path.basename(filePath)),
    ).length;
    const total = imagesCount + videosCount;
    let scanned = 0;

    // État initial du scan
    writeScanState({
      isScanning: true,
      progress: 0,
      scanned: 0,
      total,
      imagesCount,
      videosCount,
      deletedThumbs,
      startedAt,
    });

    for (const { filePath: srcPath, sourceDir } of allMediaFiles) {
      const fileName = path.basename(srcPath);
      // Créer un nom unique pour le thumb basé sur le chemin relatif et le dossier source
      const relativePath = path.relative(sourceDir, srcPath);
      const fileId = getFileId(relativePath, sourceDir);
      const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);

      if (isImage(fileName) && !fs.existsSync(thumbPath)) {
        try {
          console.log('Génération thumb pour:', relativePath);
          await generateThumb(srcPath, thumbPath);
          scanned++;
          // Mettre à jour la progression
          writeScanState({
            isScanning: true,
            progress: Math.round((scanned / total) * 100),
            scanned,
            total,
            imagesCount,
            videosCount,
            deletedThumbs,
            startedAt,
          });
        } catch (e) {
          console.error('Erreur génération thumb pour', relativePath, ':', e);
        }
      }
      if (isVideo(fileName) && !fs.existsSync(thumbPath)) {
        try {
          console.log('Génération thumb vidéo pour:', relativePath);
          await generateVideoThumb(srcPath, thumbPath);
          scanned++;
          // Mettre à jour la progression
          writeScanState({
            isScanning: true,
            progress: Math.round((scanned / total) * 100),
            scanned,
            total,
            imagesCount,
            videosCount,
            deletedThumbs,
            startedAt,
          });
        } catch (e) {
          console.error('Erreur génération thumb vidéo pour', relativePath, ':', e);
        }
      }
    }

    const completedAt = new Date().toISOString();

    // État final du scan
    writeScanState({
      isScanning: false,
      progress: 100,
      scanned,
      total,
      imagesCount,
      videosCount,
      deletedThumbs,
      startedAt,
      completedAt,
    });

    console.log(
      `Scan terminé: ${scanned} thumbs générés, ${deletedThumbs} thumbs orphelins supprimés`,
    );

    // Supprimer le lock
    if (fs.existsSync(scanLockPath)) {
      fs.unlinkSync(scanLockPath);
    }

    res.status(200).json({ scanned, total, imagesCount, videosCount, deletedThumbs });
  } catch (error) {
    // En cas d'erreur, supprimer le lock et mettre à jour l'état
    if (fs.existsSync(scanLockPath)) {
      fs.unlinkSync(scanLockPath);
    }
    writeScanState({
      isScanning: false,
      progress: 0,
      scanned: 0,
      total: 0,
      imagesCount: 0,
      videosCount: 0,
      deletedThumbs: 0,
      completedAt: new Date().toISOString(),
    });
    console.error('Erreur lors du scan:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
}
