import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { promisify } from 'util';
import { getThumbDir, isHeic } from './media';

const execPromise = promisify(exec);

/**
 * Obtient la durée d'une vidéo en format MM:SS
 */
export const getVideoDuration = async (filePath: string): Promise<string | null> => {
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
};

/**
 * Génère un thumbnail pour une image
 * Pour les HEIC, utilise ffmpeg
 * Pour les autres images, utilise sharp avec rotation EXIF
 */
export const generateImageThumb = async (srcPath: string, destPath: string): Promise<void> => {
  // Créer le dossier de destination s'il n'existe pas
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Pour les images HEIC, utiliser ffmpeg (portable et dispo dans Docker)
  if (isHeic(srcPath)) {
    return new Promise((resolve, reject) => {
      // Crop en carré 300x300 centré
      const cmd = `ffmpeg -y -i "${srcPath}" -vf "scale=300:300:force_original_aspect_ratio=increase,crop=300:300" "${destPath}"`;
      exec(cmd, (error) => {
        if (error) {
          reject(error);
        } else {
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

  console.log('Thumb généré:', destPath);
};

/**
 * Génère un thumbnail pour une vidéo
 * Prend une frame à 1s et la crop en carré 300x300
 */
export const generateVideoThumb = async (srcPath: string, destPath: string): Promise<void> => {
  // Créer le dossier de destination s'il n'existe pas
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    // Prend une frame à 1s et la crop en carré 300x300 centré
    const cmd = `ffmpeg -y -i "${srcPath}" -ss 00:00:01 -vframes 1 -vf "scale=300:300:force_original_aspect_ratio=increase,crop=300:300" "${destPath}"`;
    exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        console.log('Thumb vidéo généré:', destPath);
        resolve();
      }
    });
  });
};

/**
 * Génère un thumbnail pour un média (image ou vidéo)
 */
export const generateThumb = async (
  srcPath: string,
  destPath: string,
  isVideo: boolean,
): Promise<void> => {
  if (isVideo) {
    return generateVideoThumb(srcPath, destPath);
  } else {
    return generateImageThumb(srcPath, destPath);
  }
};

/**
 * Vérifie si un thumbnail existe pour un fileId
 */
export const thumbExists = (fileId: string): boolean => {
  const thumbDir = getThumbDir();
  const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
  return fs.existsSync(thumbPath);
};

/**
 * Obtient le chemin complet d'un thumbnail
 */
export const getThumbPath = (fileId: string): string => {
  const thumbDir = getThumbDir();
  return path.join(thumbDir, `${fileId}.thumb.jpg`);
};

/**
 * Obtient l'URL publique d'un thumbnail
 */
export const getThumbUrl = (fileId: string): string => {
  return `/api/serve-thumb/${fileId}`;
};
