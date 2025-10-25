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

  // Pour les images HEIC, privilégier heif-convert (libheif) pour qualité/couleur complètes
  if (isHeic(srcPath)) {
    // Répertoire temporaire pour conversion HEIC -> JPEG pleine résolution
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const base = path.basename(srcPath, path.extname(srcPath));
    const tempJpeg = path.join(tempDir, `${base}-${Date.now()}.jpg`);

    // 1) heif-convert (production via libheif-examples)
    // Note: heif-convert applique automatiquement l'orientation EXIF
    try {
      await execPromise(`heif-convert -q 90 "${srcPath}" "${tempJpeg}"`);
      // Forcer l'orientation EXIF à 1 (normal) sur le JPEG généré
      try {
        await execPromise(`exiftool -overwrite_original -Orientation=1 "${tempJpeg}"`);
      } catch (exifErr) {
        console.warn('exiftool non disponible ou erreur, orientation non forcée:', exifErr);
      }

      const foreground = await sharp(tempJpeg)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: false })
        .toBuffer();

      await sharp(foreground)
        .composite([{ input: foreground, gravity: 'center' }])
        .jpeg({ quality: 82 })
        .toFile(destPath);

      try {
        fs.unlinkSync(tempJpeg);
      } catch {
        // Ignorer les erreurs de suppression
      }
      console.log('Thumb HEIC généré (heif-convert', destPath);
      return;
    } catch (heifErr) {
      console.warn('heif-convert indisponible/échec, fallback ffmpeg:', heifErr);
    }

    // 2) Fallback ffmpeg: convertir en JPEG temporaire puis appliquer le même compositing (fond flouté)
    // Note: ffmpeg ne gère pas toujours bien l'orientation HEIC, heif-convert est préféré
    const tempFfmpegJpeg = path.join(tempDir, `${base}-${Date.now()}-ff.jpg`);
    await new Promise<void>((resolve, reject) => {
      const cmd = `ffmpeg -y -i "${srcPath}" -map 0:v:0 -pix_fmt yuvj420p -q:v 2 "${tempFfmpegJpeg}"`;
      exec(cmd, (error, _stdout, stderr) => {
        if (error) {
          console.error(`Erreur ffmpeg pour ${srcPath}:`, stderr);
          reject(error);
        } else {
          resolve();
        }
      });
    });

    try {
      const background = await sharp(tempFfmpegJpeg)
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .blur(20)
        .toBuffer();

      const foreground = await sharp(tempFfmpegJpeg)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: false })
        .toBuffer();

      await sharp(background)
        .composite([{ input: foreground, gravity: 'center' }])
        .jpeg({ quality: 82 })
        .toFile(destPath);
    } finally {
      try {
        fs.unlinkSync(tempFfmpegJpeg);
      } catch {
        // Ignorer les erreurs de suppression
      }
    }

    console.log('Thumb HEIC généré (ffmpeg + blurred background):', destPath);
    return;
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
  // Append a version query based on the thumbnail file mtime to bust immutable caches
  try {
    const p = getThumbPath(fileId);
    if (fs.existsSync(p)) {
      const mtime = Math.floor(fs.statSync(p).mtimeMs);
      return `/api/serve-thumb/${fileId}?v=${mtime}`;
    }
  } catch {
    // ignore FS errors and fall back
  }
  return `/api/serve-thumb/${fileId}`;
};
