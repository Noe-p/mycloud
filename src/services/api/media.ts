import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Configuration et constantes
 */
export const getMediaDirs = (): string[] => {
  const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
  return mediaDirs
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
};

export const getThumbDir = (): string => {
  return process.env.THUMB_DIR || path.join(process.cwd(), 'public', 'thumbs');
};

/**
 * Extensions de fichiers supportées
 */
export const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|heic)$/i;
export const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|mkv|hevc)$/i;
export const MEDIA_EXTENSIONS = /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i;

/**
 * Vérification du type de fichier
 */
export const isImage = (file: string): boolean => IMAGE_EXTENSIONS.test(file);
export const isVideo = (file: string): boolean => VIDEO_EXTENSIONS.test(file);
export const isHeic = (file: string): boolean => /\.heic$/i.test(file);
export const isMedia = (file: string): boolean => MEDIA_EXTENSIONS.test(file);

/**
 * Génère un identifiant unique pour un fichier basé sur son chemin et source
 */
export const getFileId = (relativePath: string, sourceDir: string): string => {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
};

/**
 * Génère un identifiant unique pour un album
 */
export const getAlbumId = (relativePath: string, sourceDir: string): string => {
  return getFileId(relativePath, sourceDir);
};

/**
 * Scanner récursivement tous les fichiers d'un dossier
 * @param dirPath - Chemin du dossier à scanner
 * @param arrayOfFiles - Tableau accumulateur (pour la récursion)
 * @returns Liste des chemins complets de fichiers
 */
export const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      // Exclure les bibliothèques Photos et autres dossiers système
      if (file.endsWith('.photoslibrary') || file.startsWith('.')) {
        continue;
      }

      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Récursion dans les sous-dossiers
          getAllFiles(filePath, arrayOfFiles);
        } else {
          arrayOfFiles.push(filePath);
        }
      } catch (error) {
        console.warn(`Erreur lecture fichier ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Erreur lecture dossier ${dirPath}:`, error);
  }

  return arrayOfFiles;
};

/**
 * Compte les médias dans un dossier (non récursif)
 */
export const countMediaInDir = (dirPath: string): number => {
  try {
    const files = fs.readdirSync(dirPath);
    return files.filter((file) => {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.statSync(filePath).isDirectory()) return false;
        return isMedia(file);
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
};

/**
 * Trouve le premier média dans un dossier (récursif)
 */
export const getFirstMedia = (dirPath: string): string | null => {
  try {
    const files = fs.readdirSync(dirPath);

    // Chercher d'abord dans le dossier actuel
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.statSync(filePath).isDirectory()) continue;
        if (isMedia(file)) {
          return file;
        }
      } catch {
        continue;
      }
    }

    // Si pas de média, chercher dans les sous-dossiers
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
          const subMedia = getFirstMedia(filePath);
          if (subMedia) {
            return path.join(file, subMedia);
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Trouve un fichier par son fileId dans tous les dossiers médias
 * @returns { filePath, sourceDir } ou null
 */
export const findFileByFileId = (
  fileId: string,
): { filePath: string; sourceDir: string } | null => {
  const mediaDirs = getMediaDirs();

  for (const mediaDir of mediaDirs) {
    if (!fs.existsSync(mediaDir)) continue;

    const allFiles = getAllFiles(mediaDir);

    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      if (!isMedia(fileName)) continue;

      const relativePath = path.relative(mediaDir, filePath);
      const currentFileId = getFileId(relativePath, mediaDir);

      if (currentFileId === fileId) {
        return { filePath, sourceDir: mediaDir };
      }
    }
  }

  return null;
};
