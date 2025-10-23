import { scanAlbums } from '@/services/api/album';
import {
  countMediaInDir,
  getAlbumId,
  getFileId,
  getFirstMedia,
  getMediaDirs,
} from '@/services/api/media';
import { getThumbUrl } from '@/services/api/thumbnail';
import { Album } from '@/types/Album';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

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
        coverThumb = getThumbUrl(fileId);
      }

      const totalMediaCount =
        rootMediaCount + albums.reduce((sum, album) => sum + album.mediaCount, 0);

      allAlbums.push({
        id: getAlbumId('', mediaDir),
        name: dirName,
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
