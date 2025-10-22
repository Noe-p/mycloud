import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Retourner les dossiers actuels
  if (req.method === 'GET') {
    const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
    // Support des dossiers multiples séparés par des virgules
    const dirsArray = mediaDirs
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    return res.status(200).json({ mediaDirs: dirsArray });
  }

  // POST: Modifier les dossiers MEDIA_DIRS
  if (req.method === 'POST') {
    const { mediaDirs } = req.body;

    // Accepter un tableau ou une chaîne
    let dirsArray: string[] = [];
    if (Array.isArray(mediaDirs)) {
      dirsArray = mediaDirs;
    } else if (typeof mediaDirs === 'string') {
      dirsArray = [mediaDirs];
    } else {
      return res.status(400).json({ error: 'Invalid mediaDirs' });
    }

    // Vérifier que tous les dossiers existent
    for (const dir of dirsArray) {
      if (!fs.existsSync(dir)) {
        return res.status(400).json({ error: `Directory does not exist: ${dir}` });
      }
    }

    try {
      // Lire le fichier .env actuel
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      const mediaDirsString = dirsArray.join(',');

      // Mettre à jour ou ajouter MEDIA_DIRS (et supprimer l'ancien MEDIA_DIR)
      const lines = envContent.split('\n');
      let found = false;
      const newLines = lines
        .map((line) => {
          if (line.startsWith('MEDIA_DIRS=')) {
            found = true;
            return `MEDIA_DIRS=${mediaDirsString}`;
          }
          // Supprimer l'ancien MEDIA_DIR si présent
          if (line.startsWith('MEDIA_DIR=')) {
            return null;
          }
          return line;
        })
        .filter((line) => line !== null);

      if (!found) {
        newLines.push(`MEDIA_DIRS=${mediaDirsString}`);
      }

      // Écrire le nouveau fichier .env
      fs.writeFileSync(envPath, newLines.join('\n'));

      // Mettre à jour la variable d'environnement pour la session en cours
      process.env.MEDIA_DIRS = mediaDirsString;
      // Garder la compatibilité avec MEDIA_DIR (premier dossier)
      process.env.MEDIA_DIR = dirsArray[0] || '';

      return res.status(200).json({ success: true, mediaDirs: dirsArray });
    } catch (error) {
      console.error('Error updating .env:', error);
      return res.status(500).json({ error: 'Failed to update .env file' });
    }
  }

  // DELETE: Supprimer un dossier spécifique
  if (req.method === 'DELETE') {
    const { mediaDir } = req.body;

    if (!mediaDir || typeof mediaDir !== 'string') {
      return res.status(400).json({ error: 'Invalid mediaDir' });
    }

    try {
      const mediaDirs = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
      const dirsArray = mediaDirs
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d !== mediaDir);

      // Lire le fichier .env actuel
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      const mediaDirsString = dirsArray.join(',');

      // Mettre à jour MEDIA_DIRS
      const lines = envContent.split('\n');
      const newLines = lines
        .map((line) => {
          if (line.startsWith('MEDIA_DIRS=')) {
            return dirsArray.length > 0 ? `MEDIA_DIRS=${mediaDirsString}` : null;
          }
          if (line.startsWith('MEDIA_DIR=')) {
            return null;
          }
          return line;
        })
        .filter((line) => line !== null);

      // Écrire le nouveau fichier .env
      fs.writeFileSync(envPath, newLines.join('\n'));

      // Mettre à jour la variable d'environnement
      process.env.MEDIA_DIRS = mediaDirsString;
      process.env.MEDIA_DIR = dirsArray[0] || '';

      return res.status(200).json({ success: true, mediaDirs: dirsArray });
    } catch (error) {
      console.error('Error updating .env:', error);
      return res.status(500).json({ error: 'Failed to update .env file' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
