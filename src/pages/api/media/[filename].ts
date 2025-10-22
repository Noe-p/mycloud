import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const mediaDir = process.env.MEDIA_DIR || '';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!mediaDir) {
    return res.status(500).json({ error: 'MEDIA_DIR not set' });
  }

  const filePath = path.join(mediaDir, filename);

  // Vérifier que le fichier existe et est dans le bon dossier
  if (!fs.existsSync(filePath) || !filePath.startsWith(mediaDir)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Déterminer le type MIME
  const ext = path.extname(filename).toLowerCase();
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
  res.setHeader('Content-Type', contentType);

  // Streamer le fichier
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
