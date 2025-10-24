import {
  isVideo as checkIsVideo,
  getFileId,
  getMediaDirs,
  rebuildFileCache,
} from '@/services/api/media';
import { scanMediaFiles } from '@/services/api/scanner';
import { getThumbPath, getVideoDuration } from '@/services/api/thumbnail';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  const startTime = Date.now();

  // Paramètres de pagination
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  // Scanner récursivement tous les fichiers médias
  const allMediaFiles = scanMediaFiles(mediaDirs);

  // Reconstruire le cache de fileIds
  rebuildFileCache(allMediaFiles);

  console.log(
    `[thumbs] ${allMediaFiles.length} fichiers médias trouvés en ${Date.now() - startTime}ms`,
  );
  console.log(`[thumbs] Chargement de ${limit} médias à partir de ${offset}`);

  // Optimisation: On ne fait pas de tri global coûteux
  // On pagine d'abord, puis on trie seulement la page demandée
  // Cela permet un chargement initial ultra rapide

  // Paginer les fichiers
  const paginatedFiles = allMediaFiles.slice(offset, offset + limit);
  const totalCount = allMediaFiles.length;
  const hasMore = offset + limit < totalCount;

  // Traiter les fichiers par lots pour éviter de surcharger le système
  const BATCH_SIZE = 50;
  const thumbs: Array<{
    file: string;
    fileId: string;
    thumb: string;
    type: string;
    duration: string | null;
    thumbReady: boolean;
    createdAt: string;
  }> = [];

  for (let i = 0; i < paginatedFiles.length; i += BATCH_SIZE) {
    const batch = paginatedFiles.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ filePath, sourceDir }) => {
        const fileName = path.basename(filePath);
        const isVideo = checkIsVideo(fileName);

        // Créer un identifiant unique basé sur le chemin relatif et le dossier source
        const relativePath = path.relative(sourceDir, filePath);
        const fileId = getFileId(relativePath, sourceDir);
        const thumbPath = getThumbPath(fileId);
        const thumbReady = fs.existsSync(thumbPath);

        // Optimisation: ne lire les stats qu'une seule fois
        const stats = fs.statSync(filePath);

        // Optimisation critique: ne récupérer la durée et EXIF QUE si nécessaire
        // Pour accélérer le chargement initial, on utilise juste les stats du fichier
        let duration: string | null = null;
        const createdDate =
          stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;

        // Seulement charger les métadonnées EXIF si c'est une vidéo avec thumb prêt
        // (pour la durée) ou si on veut vraiment la date précise
        if (thumbReady && isVideo) {
          duration = await getVideoDuration(filePath);
        }

        // Option: désactiver totalement la lecture EXIF pour accélérer
        // Si vous voulez l'EXIF, décommentez les lignes suivantes:
        // if (thumbReady) {
        //   const exifDate = await getMediaCreationDate(filePath);
        //   if (exifDate) createdDate = exifDate;
        // }

        return {
          file: relativePath,
          fileId,
          thumb: `/api/serve-thumb/${fileId}`,
          type: isVideo ? 'video' : 'image',
          duration,
          thumbReady,
          createdAt: createdDate.toISOString(),
        };
      }),
    );
    thumbs.push(...batchResults);
  }

  console.log(`[thumbs] Traitement terminé en ${Date.now() - startTime}ms`);

  res.status(200).json({
    thumbs,
    total: totalCount,
    hasMore,
    offset,
    limit,
  });
}
