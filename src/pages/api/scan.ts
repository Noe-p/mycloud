import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import sharp from 'sharp';

const mediaDir = process.env.MEDIA_DIR || '';
const thumbDir = process.env.THUMB_DIR || '';

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
  const files = fs.readdirSync(mediaDir);
  let scanned = 0;
  for (const file of files) {
    const srcPath = path.join(mediaDir, file);
    const thumbPath = path.join(thumbDir, file + '.thumb.jpg');
    if (isImage(file) && !fs.existsSync(thumbPath)) {
      try {
        console.log('Génération thumb pour:', file);
        await generateThumb(srcPath, thumbPath);
        scanned++;
      } catch (e) {
        console.error('Erreur génération thumb pour', file, ':', e);
      }
    }
    if (isVideo(file) && !fs.existsSync(thumbPath)) {
      try {
        console.log('Génération thumb vidéo pour:', file);
        await generateVideoThumb(srcPath, thumbPath);
        scanned++;
      } catch (e) {
        console.error('Erreur génération thumb vidéo pour', file, ':', e);
      }
    }
  }
  res.status(200).json({ scanned });
}
