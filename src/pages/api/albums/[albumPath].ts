import { findAlbumByPath } from '@/services/api/album';
import { getMediaDate } from '@/services/api/exif';
import { isVideo as checkIsVideo, getFileId, getMediaDirs } from '@/services/api/media';
import { getThumbUrl, getVideoDuration, thumbExists } from '@/services/api/thumbnail';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { albumPath } = req.query;

  if (!albumPath || typeof albumPath !== 'string') {
    return res.status(400).json({ error: 'Invalid album path' });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  // Trouver le dossier correspondant
  const albumInfo = findAlbumByPath(mediaDirs, albumPath);

  if (!albumInfo) {
    return res.status(404).json({ error: 'Album not found' });
  }

  const { targetDir, sourceDir } = albumInfo;

  // Paramètres de pagination
  const limit = parseInt(
    Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit ?? '50',
  );
  const offset = parseInt(
    Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset ?? '0',
  );

  try {
    // Lister tous les fichiers du dossier (non récursif)
    const files = fs.readdirSync(targetDir);

    const mediaFiles = files
      .filter((file) => {
        // Ignorer les fichiers cachés et métadonnées macOS
        if (file.startsWith('.')) return false;

        const filePath = path.join(targetDir, file);
        try {
          if (fs.statSync(filePath).isDirectory()) return false;
          return /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(file);
        } catch {
          return false;
        }
      })
      .map((file) => path.join(targetDir, file));

    const totalCount = mediaFiles.length;
    const paginatedFiles = mediaFiles.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Traiter les fichiers avec leurs dates
    const mediasWithDates = await Promise.all(
      paginatedFiles.map(async (filePath) => {
        const fileName = path.basename(filePath);
        const isVideo = checkIsVideo(fileName);

        // Créer un identifiant unique
        const relativePath = path.relative(sourceDir, filePath);
        const fileId = getFileId(relativePath, sourceDir);
        const thumbReady = thumbExists(fileId);

        // Obtenir la date de création (EXIF ou stats)
        const createdDate = await getMediaDate(filePath);

        let duration: string | null = null;
        if (thumbReady && isVideo) {
          duration = await getVideoDuration(filePath);
        }

        return {
          file: relativePath,
          fileId,
          thumb: getThumbUrl(fileId),
          type: isVideo ? 'video' : 'image',
          duration,
          thumbReady,
          createdAt: createdDate.toISOString(),
          _createdDate: createdDate, // Pour le tri
        };
      }),
    );

    // Trier du plus récent au plus ancien
    const medias = mediasWithDates
      .sort((a, b) => b._createdDate.getTime() - a._createdDate.getTime())
      .map(({ _createdDate, ...media }) => media); // Retirer le champ temporaire

    res.status(200).json({
      medias,
      total: totalCount,
      hasMore,
      offset,
      limit,
      albumPath: decodeURIComponent(albumPath),
    });
  } catch (error) {
    console.error('Error reading album:', error);
    res.status(500).json({ error: 'Failed to read album' });
  }
}
