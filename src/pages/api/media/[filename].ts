import crypto from 'crypto';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const mediaDir = process.env.MEDIA_DIR || '';

// Fonction pour scanner récursivement tous les fichiers
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);

    // Exclure les bibliothèques Photos et autres dossiers système
    if (file.endsWith('.photoslibrary') || file.startsWith('.')) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Fonction pour créer un identifiant unique basé sur le chemin
function getFileId(relativePath: string): string {
  return crypto.createHash('sha256').update(relativePath).digest('hex').substring(0, 16);
}

// Cache pour éviter de rescanner à chaque requête
let fileIdCache: Map<string, string> | null = null;

function buildFileIdCache(): Map<string, string> {
  if (fileIdCache) return fileIdCache;

  const cache = new Map<string, string>();
  const allFiles = getAllFiles(mediaDir);

  allFiles.forEach((filePath) => {
    const relativePath = path.relative(mediaDir, filePath);
    const fileId = getFileId(relativePath);
    cache.set(fileId, filePath);
  });

  fileIdCache = cache;
  return cache;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!mediaDir) {
    return res.status(500).json({ error: 'MEDIA_DIR not set' });
  }

  // Construire le cache des IDs
  const cache = buildFileIdCache();

  // Chercher le fichier par son ID
  const filePath = cache.get(filename);

  if (!filePath || !fs.existsSync(filePath) || !filePath.startsWith(mediaDir)) {
    return res.status(404).json({ error: 'File not found' });
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
  res.setHeader('Content-Type', contentType);

  // Streamer le fichier
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
