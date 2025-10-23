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

// Fonction pour créer un identifiant unique basé sur le chemin et le dossier source
function getFileId(relativePath: string, sourceDir: string): string {
  const uniquePath = `${sourceDir}/${relativePath}`;
  return crypto.createHash('sha256').update(uniquePath).digest('hex').substring(0, 16);
}

// Cache pour éviter de rescanner à chaque requête
let fileIdCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function buildFileIdCache(): Map<string, string> {
  const now = Date.now();

  // Invalider le cache après TTL
  if (fileIdCache && now - cacheTimestamp < CACHE_TTL) {
    return fileIdCache;
  }

  console.log('[media] Rebuilding file ID cache...');
  const cache = new Map<string, string>();
  const mediaDirs = getMediaDirs();

  for (const mediaDir of mediaDirs) {
    if (!fs.existsSync(mediaDir)) {
      console.warn(`Directory does not exist: ${mediaDir}`);
      continue;
    }

    const allFiles = getAllFiles(mediaDir);

    allFiles.forEach((filePath) => {
      const relativePath = path.relative(mediaDir, filePath);
      const fileId = getFileId(relativePath, mediaDir);
      cache.set(fileId, filePath);
    });
  }

  fileIdCache = cache;
  cacheTimestamp = now;
  console.log(`[media] Cache built with ${cache.size} files`);
  return cache;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  // Construire le cache des IDs
  const cache = buildFileIdCache();

  // Chercher le fichier par son ID
  const filePath = cache.get(filename);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

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
