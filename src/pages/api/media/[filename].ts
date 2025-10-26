import { allowMethods } from '@/services/api/http';
import { findFileByFileId, getMediaDirs, isHeic } from '@/services/api/media';
import { exec } from 'child_process';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Nettoie les fichiers JPEG temporaires de plus de 1 heure
const cleanOldTempFiles = (): void => {
  const tempDir = path.join(process.cwd(), 'public', 'temp');
  if (!fs.existsSync(tempDir)) return;

  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > oneHour) {
        fs.unlinkSync(filePath);
        console.log(`[API /media] Fichier temp nettoyé: ${file}`);
      }
    }
  } catch (error) {
    console.error('[API /media] Erreur nettoyage fichiers temp:', error);
  }
};

// Supprime les anciens fichiers temporaires pour ce media (par fileId et par base HEIC)
const pruneTempFiles = (keepPath: string, fileId: string, heicBase: string): void => {
  const tempDir = path.join(process.cwd(), 'public', 'temp');
  if (!fs.existsSync(tempDir)) return;
  try {
    const files = fs.readdirSync(tempDir);
    for (const f of files) {
      const full = path.join(tempDir, f);
      if (full === keepPath) continue;
      if (f.startsWith(`${fileId}-`) || f.startsWith(`${heicBase}-`)) {
        try {
          fs.unlinkSync(full);
        } catch {
          // Ignorer les erreurs de suppression
        }
      }
    }
  } catch {
    // Ignorer les erreurs de lecture du dossier
  }
};

// Convertit un HEIC en JPEG temporaire, nommage déterministe (fileId + mtime source)
const convertHeicToJpeg = async (
  heicPath: string,
  fileId: string,
  srcMtimeMs?: number,
): Promise<string> => {
  const tempDir = path.join(process.cwd(), 'public', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const heicBase = path.basename(heicPath, path.extname(heicPath));
  let stamp = srcMtimeMs != null ? Math.floor(srcMtimeMs) : Date.now();
  if (srcMtimeMs == null) {
    try {
      const st = fs.statSync(heicPath);
      stamp = Math.floor(st.mtimeMs);
    } catch {
      // Utiliser Date.now() si impossible de lire mtime
    }
  }

  const tempJpegPath = path.join(tempDir, `${fileId}-${stamp}.jpg`);

  if (fs.existsSync(tempJpegPath)) {
    return tempJpegPath;
  }

  // 1) heif-convert (libheif)
  // Note: heif-convert applique automatiquement l'orientation EXIF
  try {
    await execPromise(`heif-convert -q 92 '${heicPath}' '${tempJpegPath}'`);
    // Préserver l'orientation en copiant le tag Orientation du HEIC vers le JPEG
    try {
      await execPromise(
        `exiftool -overwrite_original -TagsFromFile '${heicPath}' -Orientation '${tempJpegPath}'`,
      );
    } catch (exifErr) {
      console.warn(
        '[API /media] exiftool non disponible ou erreur lors de la copie Orientation (fallback: laisser tel quel):',
        exifErr,
      );
    }
    console.log('[API /media] HEIC converti en JPEG avec heif-convert:', tempJpegPath);
    pruneTempFiles(tempJpegPath, fileId, heicBase);
    return tempJpegPath;
  } catch (heifError) {
    console.warn('[API /media] Échec heif-convert, tentative ffmpeg:', heifError);
  }

  // 2) ffmpeg (sélection du premier stream vidéo couleur)
  // Note: ffmpeg ne gère pas toujours bien l'orientation HEIC, heif-convert est préféré
  try {
    await execPromise(
      `ffmpeg -y -max_streams 10000 -i '${heicPath}' -map 0:v:0 -pix_fmt yuvj420p -q:v 1 '${tempJpegPath}'`,
    );
    console.log('[API /media] HEIC converti en JPEG avec ffmpeg:', tempJpegPath);
    pruneTempFiles(tempJpegPath, fileId, heicBase);
    return tempJpegPath;
  } catch (ffmpegError) {
    console.warn('[API /media] Échec ffmpeg, tentative avec sips (macOS dev):', ffmpegError);
  }

  // 3) sips (macOS dev-only)
  try {
    await execPromise(`sips -s format jpeg '${heicPath}' --out '${tempJpegPath}'`);
    console.log('[API /media] HEIC converti en JPEG avec sips:', tempJpegPath);
    pruneTempFiles(tempJpegPath, fileId, heicBase);
    return tempJpegPath;
  } catch (sipsError) {
    console.error(
      '[API /media] Erreur conversion HEIC (heif-convert, ffmpeg, sips échoués):',
      sipsError,
    );
    throw new Error(
      `Impossible de convertir le fichier HEIC: ${path.basename(
        heicPath,
      )}. Le fichier est peut-être corrompu.`,
    );
  }
};

// Nettoyer les fichiers temp au démarrage
cleanOldTempFiles();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    console.error('[API /media] Erreur: filename invalide', { filename });
    return res.status(400).json({ error: 'Invalid filename' });
  }

  console.log(`[API /media] Requête pour fileId: ${filename}`);

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    console.error('[API /media] Erreur: MEDIA_DIRS non configuré');
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  try {
    // Chercher le fichier par son ID
    const fileInfo = findFileByFileId(filename);

    if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
      console.error(`[API /media] Erreur: Fichier non trouvé pour fileId: ${filename}`, {
        fileInfo,
      });
      return res.status(404).json({ error: 'File not found' });
    }

    let { filePath } = fileInfo;
    let isConvertedHeic = false;

    console.log('[API /media] Fichier trouvé:', filePath);
    console.log('[API /media] Extension:', path.extname(filePath), 'isHeic:', isHeic(filePath));

    // Convertir HEIC en JPEG si nécessaire
    if (isHeic(filePath)) {
      console.log('[API /media] Conversion HEIC en cours pour:', filePath);
      try {
        const srcStat = fs.statSync(filePath);
        filePath = await convertHeicToJpeg(filePath, filename, srcStat.mtimeMs);
        isConvertedHeic = true;
      } catch (error) {
        console.error('[API /media] Erreur conversion HEIC:', error);
        return res.status(500).json({ error: 'HEIC conversion failed' });
      }
    }

    // Vérifier que le fichier appartient à un des dossiers autorisés (sauf si converti)
    if (!isConvertedHeic) {
      const isInAllowedDir = mediaDirs.some((dir) => filePath.startsWith(dir));
      if (!isInAllowedDir) {
        console.error(
          '[API /media] Erreur: Accès refusé au fichier',
          filePath,
          '(pas dans MEDIA_DIRS)',
        );
        return res.status(403).json({ error: 'Access denied' });
      }
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

    // Pour les fichiers HEIC convertis, le type est toujours JPEG
    const contentType = isConvertedHeic
      ? 'image/jpeg'
      : mimeTypes[ext] || 'application/octet-stream';
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

    // Note: Les fichiers HEIC convertis temporaires sont nettoyés périodiquement
    // par cleanOldTempFiles() au lieu d'être supprimés immédiatement,
    // car Next.js Image Optimizer peut faire plusieurs requêtes
  } catch (error) {
    console.error('[API /media] Erreur lors du traitement de', filename, ':', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
