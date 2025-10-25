import { atomicWriteJson } from '@/services/fs-utils';
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
 * Cache des fileIds pour éviter de rescanner tous les fichiers à chaque requête
 */
const FILE_CACHE_PATH = path.join(process.cwd(), 'public', 'file-cache.json');
let fileCache: Map<string, { filePath: string; sourceDir: string }> | null = null;

/**
 * Charge le cache des fichiers
 */
export const loadFileCache = (): void => {
  try {
    if (fs.existsSync(FILE_CACHE_PATH)) {
      const data: Record<string, { filePath: string; sourceDir: string }> = JSON.parse(
        fs.readFileSync(FILE_CACHE_PATH, 'utf-8'),
      );
      fileCache = new Map(Object.entries(data));
      console.log(`Cache de fichiers chargé: ${fileCache.size} fichiers`);
    } else {
      fileCache = new Map();
      console.log("Aucun cache de fichiers trouvé, création d'un nouveau cache");
    }
  } catch (error) {
    console.error('Erreur lors du chargement du cache de fichiers:', error);
    fileCache = new Map();
  }
};

/**
 * Sauvegarde le cache des fichiers
 */
export const saveFileCache = (): void => {
  try {
    if (!fileCache) return;
    const data: Record<string, { filePath: string; sourceDir: string }> = {};
    fileCache.forEach((value, key) => {
      data[key] = value;
    });
    atomicWriteJson(FILE_CACHE_PATH, data, 2);
    console.log(`Cache de fichiers sauvegardé: ${fileCache.size} fichiers`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du cache de fichiers:', error);
  }
};

/**
 * Met à jour le cache avec un nouveau fichier
 */
export const updateFileCacheEntry = (fileId: string, filePath: string, sourceDir: string): void => {
  if (!fileCache) {
    loadFileCache();
  }
  fileCache!.set(fileId, { filePath, sourceDir });
};

/**
 * Reconstruit tout le cache à partir des fichiers médias
 */
export const rebuildFileCache = (
  mediaFiles: Array<{ filePath: string; sourceDir: string }>,
): void => {
  fileCache = new Map();
  for (const { filePath, sourceDir } of mediaFiles) {
    const relativePath = path.relative(sourceDir, filePath);
    const fileId = getFileId(relativePath, sourceDir);
    fileCache.set(fileId, { filePath, sourceDir });
  }
  saveFileCache();
};

// Charger le cache au démarrage
loadFileCache();

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
      // Ignorer les fichiers cachés et métadonnées macOS
      if (file.startsWith('.')) return false;

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
      // Ignorer les fichiers cachés et métadonnées macOS
      if (file.startsWith('.')) continue;

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
 * Utilise le cache pour éviter de scanner tous les fichiers à chaque requête
 * @returns { filePath, sourceDir } ou null
 */
export const findFileByFileId = (
  fileId: string,
): { filePath: string; sourceDir: string } | null => {
  // Vérifier d'abord dans le cache
  if (!fileCache) {
    loadFileCache();
  }

  const cached = fileCache!.get(fileId);
  if (cached && fs.existsSync(cached.filePath)) {
    return cached;
  }

  // Si pas dans le cache ou fichier n'existe plus, scanner (fallback)
  console.warn(`FileId ${fileId} non trouvé dans le cache, scan en cours...`);
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
        // Mettre à jour le cache
        updateFileCacheEntry(fileId, filePath, mediaDir);
        saveFileCache();
        return { filePath, sourceDir: mediaDir };
      }
    }
  }

  console.error(`FileId ${fileId} non trouvé après scan complet`);
  return null;
};
