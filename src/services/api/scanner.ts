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
 */
export const cleanOrphanThumbs = (validFileIds: Set<string>): number => {
  const thumbDir = getThumbDir();
  let deletedCount = 0;

  if (!fs.existsSync(thumbDir)) {
    return 0;
  }

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
