import { getMediaDate } from '@/services/exif';
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

// Fonction pour créer un identifiant unique basé sur le chemin et le dossier source
function getFileId(relativePath: string, sourceDir: string): string {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
}

// Fonction pour obtenir la durée d'une vidéo
async function getVideoDuration(filePath: string): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);

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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { albumPath } = req.query;

  if (!albumPath || typeof albumPath !== 'string') {
    return res.status(400).json({ error: 'Invalid album path' });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  // Décoder le chemin de l'album (peut contenir des /)
  const decodedPath = decodeURIComponent(albumPath);

  // Trouver le dossier source correspondant
  let targetDir: string | null = null;
  let sourceDir: string | null = null;

  for (const mediaDir of mediaDirs) {
    if (decodedPath === '' || decodedPath === path.basename(mediaDir)) {
      // Dossier racine
      targetDir = mediaDir;
      sourceDir = mediaDir;
      break;
    } else {
      // Sous-dossier
      const fullPath = path.join(mediaDir, decodedPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        targetDir = fullPath;
        sourceDir = mediaDir;
        break;
      }
    }
  }

  if (!targetDir || !sourceDir) {
    return res.status(404).json({ error: 'Album not found' });
  }

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
        const filePath = path.join(targetDir, file);
        if (fs.statSync(filePath).isDirectory()) return false;
        return /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(file);
      })
      .map((file) => path.join(targetDir, file));

    const totalCount = mediaFiles.length;
    const paginatedFiles = mediaFiles.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    const thumbDir = process.env.THUMB_DIR || path.join(process.cwd(), 'public', 'thumbs');

    // Traiter les fichiers avec leurs dates
    const mediasWithDates = await Promise.all(
      paginatedFiles.map(async (filePath) => {
        const fileName = path.basename(filePath);
        const isVideo = /\.(mp4|mov|avi|mkv|hevc)$/i.test(fileName);

        // Créer un identifiant unique
        const relativePath = path.relative(sourceDir, filePath);
        const fileId = getFileId(relativePath, sourceDir);
        const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
        const thumbReady = fs.existsSync(thumbPath);

        // Obtenir la date de création (EXIF ou stats)
        const createdDate = await getMediaDate(filePath);

        let duration: string | null = null;
        if (thumbReady && isVideo) {
          duration = await getVideoDuration(filePath);
        }

        return {
          file: relativePath,
          fileId,
          thumb: `/api/serve-thumb/${fileId}`,
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
      albumPath: decodedPath,
    });
  } catch (error) {
    console.error('Error reading album:', error);
    res.status(500).json({ error: 'Failed to read album' });
  }
}
