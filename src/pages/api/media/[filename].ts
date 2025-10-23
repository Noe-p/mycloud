import { findFileByFileId, getMediaDirs } from '@/services/api/media';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  // Chercher le fichier par son ID
  const fileInfo = findFileByFileId(filename);

  if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { filePath } = fileInfo;

  // Vérifier que le fichier appartient à un des dossiers autorisés
  const isInAllowedDir = mediaDirs.some((dir) => filePath.startsWith(dir));
  if (!isInAllowedDir) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Déterminer le type MIME
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.heic': 'image/heic',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.hevc': 'video/hevc',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  // Headers pour supporter le streaming vidéo avec range requests
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  // Gérer les range requests (nécessaire pour le seeking dans les vidéos)
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': chunksize,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    // Streamer le fichier complet
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
