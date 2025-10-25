import { getThumbPath } from '@/services/api/thumbnail';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query;

  if (typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Invalid fileId' });
  }

  // Construire le chemin du fichier thumb
  const thumbPath = getThumbPath(fileId);

  // Vérifier si le fichier existe
  if (!fs.existsSync(thumbPath)) {
    return res.status(404).json({ error: 'Thumbnail not found' });
  }

  try {
    // Définir les headers appropriés
    const stat = fs.statSync(thumbPath);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = fs.createReadStream(thumbPath);
    stream.on('error', (err) => {
      console.error('Stream error serving thumbnail:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve thumbnail' });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
}
