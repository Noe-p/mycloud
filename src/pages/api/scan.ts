import crypto from 'crypto';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import sharp from 'sharp';

const mediaDir = process.env.MEDIA_DIR || '';
const thumbDir = process.env.THUMB_DIR || '';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!mediaDir || !thumbDir) {
    return res.status(500).json({ error: 'MEDIA_DIR or THUMB_DIR not set' });
  }

  // Scanner récursivement tous les fichiers
  const allFiles = getAllFiles(mediaDir);

  // Filtrer pour ne garder que les médias
  const mediaFiles = allFiles.filter((filePath) => {
    const fileName = path.basename(filePath);
    return isImage(fileName) || isVideo(fileName);
  });

  // Créer un Set des fileIds valides pour comparaison rapide
  const validFileIds = new Set<string>();
  mediaFiles.forEach((filePath) => {
    const relativePath = path.relative(mediaDir, filePath);
    const fileId = getFileId(relativePath);
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

  const imagesCount = mediaFiles.filter((f) => isImage(path.basename(f))).length;
  const videosCount = mediaFiles.filter((f) => isVideo(path.basename(f))).length;
  const total = imagesCount + videosCount;
  let scanned = 0;

  for (const srcPath of mediaFiles) {
    const fileName = path.basename(srcPath);
    // Créer un nom unique pour le thumb basé sur le chemin relatif
    const relativePath = path.relative(mediaDir, srcPath);
    const fileId = getFileId(relativePath);
    const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);

    if (isImage(fileName) && !fs.existsSync(thumbPath)) {
      try {
        console.log('Génération thumb pour:', relativePath);
        await generateThumb(srcPath, thumbPath);
        scanned++;
      } catch (e) {
        console.error('Erreur génération thumb pour', relativePath, ':', e);
      }
    }
    if (isVideo(fileName) && !fs.existsSync(thumbPath)) {
      try {
        console.log('Génération thumb vidéo pour:', relativePath);
        await generateVideoThumb(srcPath, thumbPath);
        scanned++;
      } catch (e) {
        console.error('Erreur génération thumb vidéo pour', relativePath, ':', e);
      }
    }
  }

  console.log(
    `Scan terminé: ${scanned} thumbs générés, ${deletedThumbs} thumbs orphelins supprimés`,
  );
  res.status(200).json({ scanned, total, imagesCount, videosCount, deletedThumbs });
}
