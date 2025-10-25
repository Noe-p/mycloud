import { ScanState } from '@/types/Scan';
import fs from 'fs';
import path from 'path';
import { getAllFiles, getFileId, getThumbDir, isImage, isMedia, isVideo } from './media';
import { generateThumb, getThumbPath } from './thumbnail';

const scanLockPath = path.join(process.cwd(), 'public', 'scan.lock');
const scanStatePath = path.join(process.cwd(), 'public', 'scan-state.json');

/**
 * Vérifie si un scan est en cours
 */
export const isScanInProgress = (): boolean => {
  return fs.existsSync(scanLockPath);
};

/**
 * Lit l'état actuel du scan depuis le fichier
 */
export const readScanState = (): ScanState | null => {
  try {
    if (fs.existsSync(scanStatePath)) {
      const content = fs.readFileSync(scanStatePath, 'utf-8');
      return JSON.parse(content) as ScanState;
    }
  } catch (e) {
    console.error('Erreur lecture scan state:', e);
  }
  return null;
};

/**
 * Écrit l'état du scan dans le fichier
 */
export const writeScanState = (state: ScanState): void => {
  try {
    fs.writeFileSync(scanStatePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Erreur écriture scan state:', e);
  }
};

/**
 * Crée le fichier lock pour indiquer qu'un scan est en cours
 */
export const createScanLock = (): void => {
  try {
    fs.writeFileSync(scanLockPath, new Date().toISOString());
  } catch (e) {
    console.error('Erreur création lock:', e);
  }
};

/**
 * Supprime le fichier lock
 */
export const removeScanLock = (): void => {
  try {
    if (fs.existsSync(scanLockPath)) {
      fs.unlinkSync(scanLockPath);
    }
  } catch (e) {
    console.error('Erreur suppression lock:', e);
  }
};

/**
 * Scanner tous les fichiers médias dans les dossiers donnés
 */
export const scanMediaFiles = (
  mediaDirs: string[],
): Array<{ filePath: string; sourceDir: string }> => {
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
        return isMedia(fileName);
      })
      .map((filePath) => ({ filePath, sourceDir: mediaDir }));

    allMediaFiles.push(...mediaFilesInDir);
  }

  return allMediaFiles;
};

/**
 * Supprime les thumbnails orphelins (dont le média source n'existe plus)
 * et nettoie les caches et fichiers temporaires
 */
export const cleanOrphanThumbs = (validFileIds: Set<string>): number => {
  const thumbDir = getThumbDir();
  let deletedCount = 0;

  // 1. Nettoyer les thumbnails orphelins
  if (fs.existsSync(thumbDir)) {
    try {
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
              deletedCount++;
              console.log('Thumb orphelin supprimé:', thumbFile);
            } catch (e) {
              console.error('Erreur suppression thumb orphelin', thumbFile, ':', e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Erreur nettoyage thumbs orphelins:', e);
    }
  }

  // 2. Nettoyer le dossier temp
  const tempDir = path.join(process.cwd(), 'public', 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      const tempFiles = fs.readdirSync(tempDir);
      for (const tempFile of tempFiles) {
        const tempPath = path.join(tempDir, tempFile);
        try {
          if (fs.statSync(tempPath).isFile()) {
            fs.unlinkSync(tempPath);
            deletedCount++;
            console.log('Fichier temporaire supprimé:', tempFile);
          }
        } catch (e) {
          console.error('Erreur suppression fichier temporaire', tempFile, ':', e);
        }
      }
    } catch (e) {
      console.error('Erreur nettoyage dossier temp:', e);
    }
  }

  // 3. Nettoyer le cache EXIF
  const exifCachePath = path.join(process.cwd(), 'public', 'exif-cache.json');
  if (fs.existsSync(exifCachePath)) {
    try {
      const exifData: Record<string, string> = JSON.parse(fs.readFileSync(exifCachePath, 'utf-8'));
      const cleanedExifData: Record<string, string> = {};
      let exifEntriesRemoved = 0;

      Object.entries(exifData).forEach(([filePath, date]) => {
        if (fs.existsSync(filePath)) {
          cleanedExifData[filePath] = date;
        } else {
          exifEntriesRemoved++;
          console.log('Entrée EXIF orpheline supprimée:', filePath);
        }
      });

      if (exifEntriesRemoved > 0) {
        fs.writeFileSync(exifCachePath, JSON.stringify(cleanedExifData, null, 2));
        console.log(`${exifEntriesRemoved} entrées EXIF orphelines supprimées`);
      }
    } catch (e) {
      console.error('Erreur nettoyage cache EXIF:', e);
    }
  }

  // 4. Nettoyer le cache de fichiers
  const fileCachePath = path.join(process.cwd(), 'public', 'file-cache.json');
  if (fs.existsSync(fileCachePath)) {
    try {
      const fileData: Record<string, { filePath: string; sourceDir: string }> = JSON.parse(
        fs.readFileSync(fileCachePath, 'utf-8'),
      );
      const cleanedFileData: Record<string, { filePath: string; sourceDir: string }> = {};
      let fileEntriesRemoved = 0;

      Object.entries(fileData).forEach(([fileId, { filePath, sourceDir }]) => {
        if (validFileIds.has(fileId) && fs.existsSync(filePath)) {
          cleanedFileData[fileId] = { filePath, sourceDir };
        } else {
          fileEntriesRemoved++;
          console.log('Entrée cache fichier orpheline supprimée:', fileId, filePath);
        }
      });

      if (fileEntriesRemoved > 0) {
        fs.writeFileSync(fileCachePath, JSON.stringify(cleanedFileData, null, 2));
        console.log(`${fileEntriesRemoved} entrées cache fichier orphelines supprimées`);
      }
    } catch (e) {
      console.error('Erreur nettoyage cache fichiers:', e);
    }
  }

  return deletedCount;
};

/**
 * Génère les thumbnails pour les fichiers qui n'en ont pas
 */
export const generateMissingThumbs = async (
  mediaFiles: Array<{ filePath: string; sourceDir: string }>,
  onProgress?: (scanned: number, total: number) => void,
): Promise<{ scanned: number; imagesCount: number; videosCount: number }> => {
  const thumbDir = getThumbDir();

  // Créer le dossier thumbs s'il n'existe pas
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }

  let scanned = 0;
  let imagesCount = 0;
  let videosCount = 0;

  for (const { filePath, sourceDir } of mediaFiles) {
    const fileName = path.basename(filePath);
    const isVideoFile = isVideo(fileName);
    const isImageFile = isImage(fileName);

    if (isImageFile) imagesCount++;
    if (isVideoFile) videosCount++;

    const relativePath = path.relative(sourceDir, filePath);
    const fileId = getFileId(relativePath, sourceDir);
    const thumbPath = getThumbPath(fileId);

    // Générer le thumb s'il n'existe pas
    if (!fs.existsSync(thumbPath)) {
      try {
        await generateThumb(filePath, thumbPath, isVideoFile);
        console.log(`Thumb généré: ${fileName}`);
      } catch (error) {
        console.error(`Erreur génération thumb pour ${fileName}:`, error);
      }
    }

    scanned++;
    if (onProgress) {
      onProgress(scanned, mediaFiles.length);
    }
  }

  return { scanned, imagesCount, videosCount };
};

/**
 * Construit un Set de tous les fileIds valides
 */
export const buildValidFileIdsSet = (
  mediaFiles: Array<{ filePath: string; sourceDir: string }>,
): Set<string> => {
  const validFileIds = new Set<string>();

  for (const { filePath, sourceDir } of mediaFiles) {
    const relativePath = path.relative(sourceDir, filePath);
    const fileId = getFileId(relativePath, sourceDir);
    validFileIds.add(fileId);
  }

  return validFileIds;
};
