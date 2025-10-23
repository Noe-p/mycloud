import crypto from 'crypto';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

// Support des dossiers multiples
const getMediaDirs = (): string[] => {
  const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
  return mediaDirs
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
};

interface Album {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  mediaCount: number;
  subAlbums: Album[];
  coverThumb?: string | undefined;
  hasMedia: boolean;
}

// Fonction pour créer un identifiant unique basé sur le chemin
function getAlbumId(relativePath: string, sourceDir: string): string {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
}

// Fonction pour compter les médias dans un dossier (non récursif)
function countMediaInDir(dirPath: string): number {
  try {
    const files = fs.readdirSync(dirPath);
    return files.filter((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) return false;
      return /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(file);
    }).length;
  } catch {
    return 0;
  }
}

// Fonction pour obtenir le premier média d'un dossier (pour la couverture)
function getFirstMedia(dirPath: string): string | null {
  try {
    const files = fs.readdirSync(dirPath);

    // Chercher d'abord dans le dossier actuel
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) continue;
      if (/\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(file)) {
        return file;
      }
    }

    // Si pas de média, chercher dans les sous-dossiers
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
        const subMedia = getFirstMedia(filePath);
        if (subMedia) {
          return path.join(file, subMedia);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Fonction pour créer un identifiant de fichier
function getFileId(relativePath: string, sourceDir: string): string {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
}

// Scanner récursivement les dossiers et construire l'arborescence
function scanAlbums(dirPath: string, sourceDir: string, basePath: string = ''): Album[] {
  const albums: Album[] = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      // Ignorer les dossiers cachés et la photothèque
      if (item.startsWith('.') || item.endsWith('.photoslibrary')) {
        continue;
      }

      const itemPath = path.join(dirPath, item);
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
            coverThumb = `/api/serve-thumb/${fileId}`;
          }

          albums.push({
            id: getAlbumId(relativePath, sourceDir),
            name: item,
            path: itemPath,
            relativePath,
            mediaCount: totalMediaCount,
            subAlbums,
            coverThumb,
            hasMedia: mediaCount > 0,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return albums;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  const allAlbums: Album[] = [];

  // Scanner chaque dossier racine
  for (const mediaDir of mediaDirs) {
    if (!fs.existsSync(mediaDir)) {
      console.warn(`Directory does not exist: ${mediaDir}`);
      continue;
    }

    const dirName = path.basename(mediaDir);
    const albums = scanAlbums(mediaDir, mediaDir);

    // Si le dossier racine contient des médias, l'ajouter comme album
    const rootMediaCount = countMediaInDir(mediaDir);
    if (rootMediaCount > 0 || albums.length > 0) {
      const firstMedia = getFirstMedia(mediaDir);
      let coverThumb: string | undefined;

      if (firstMedia) {
        const fileId = getFileId(firstMedia, mediaDir);
        coverThumb = `/api/serve-thumb/${fileId}`;
      }

      const totalMediaCount =
        rootMediaCount + albums.reduce((sum, album) => sum + album.mediaCount, 0);

      allAlbums.push({
        id: getAlbumId('', mediaDir),
        name: dirName,
        path: mediaDir,
        relativePath: '',
        mediaCount: totalMediaCount,
        subAlbums: albums,
        coverThumb,
        hasMedia: rootMediaCount > 0,
      });
    }
  }

  res.status(200).json({ albums: allAlbums });
}
