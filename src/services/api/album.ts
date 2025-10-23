import { Album } from '@/types/Album';
import fs from 'fs';
import path from 'path';
import { countMediaInDir, getAlbumId, getFileId, getFirstMedia } from './media';
import { getThumbUrl } from './thumbnail';

/**
 * Scanner récursivement les dossiers et construire l'arborescence d'albums
 */
export const scanAlbums = (dirPath: string, sourceDir: string, basePath: string = ''): Album[] => {
  const albums: Album[] = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      // Ignorer les dossiers cachés et la photothèque
      if (item.startsWith('.') || item.endsWith('.photoslibrary')) {
        continue;
      }

      const itemPath = path.join(dirPath, item);

      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const relativePath = basePath ? path.join(basePath, item) : item;
          const mediaCount = countMediaInDir(itemPath);
          const subAlbums = scanAlbums(itemPath, sourceDir, relativePath);

          // Compter tous les médias (y compris dans les sous-dossiers)
          const totalMediaCount =
            mediaCount + subAlbums.reduce((sum, sub) => sum + sub.mediaCount, 0);

          if (totalMediaCount > 0) {
            const firstMedia = getFirstMedia(itemPath);
            let coverThumb: string | undefined;

            if (firstMedia) {
              const mediaRelativePath = path.join(relativePath, firstMedia);
              const fileId = getFileId(mediaRelativePath, sourceDir);
              coverThumb = getThumbUrl(fileId);
            }

            albums.push({
              id: getAlbumId(relativePath, sourceDir),
              name: item,
              relativePath,
              mediaCount: totalMediaCount,
              subAlbums,
              coverThumb,
              hasMedia: mediaCount > 0,
            });
          }
        }
      } catch (error) {
        console.warn(`Erreur lecture élément ${itemPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Erreur scan dossier ${dirPath}:`, error);
  }

  return albums;
};

/**
 * Trouve un album par son chemin relatif
 */
export const findAlbumByPath = (
  mediaDirs: string[],
  albumPath: string,
): { targetDir: string; sourceDir: string } | null => {
  const decodedPath = decodeURIComponent(albumPath);

  for (const mediaDir of mediaDirs) {
    if (decodedPath === '' || decodedPath === path.basename(mediaDir)) {
      // Dossier racine
      return { targetDir: mediaDir, sourceDir: mediaDir };
    } else {
      // Sous-dossier
      const fullPath = path.join(mediaDir, decodedPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return { targetDir: fullPath, sourceDir: mediaDir };
      }
    }
  }

  return null;
};
