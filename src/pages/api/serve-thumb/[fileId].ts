import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const thumbDir = process.env.THUMB_DIR || path.join(process.cwd(), 'public', 'thumbs');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query;

  if (typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Invalid fileId' });
  }

  // Construire le chemin du fichier thumb
  const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);

  // Vérifier si le fichier existe
  if (!fs.existsSync(thumbPath)) {
    return res.status(404).json({ error: 'Thumbnail not found' });
  }

  try {
    // Lire le fichier
    const fileBuffer = fs.readFileSync(thumbPath);

    // Définir les headers appropriés
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Envoyer le fichier
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
}
