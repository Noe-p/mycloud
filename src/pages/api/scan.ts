import { getMediaDirs, isImage, isVideo, rebuildFileCache } from '@/services/api/media';
import {
  buildValidFileIdsSet,
  cleanOrphanThumbs,
  createScanLock,
  generateMissingThumbs,
  isScanInProgress,
  readScanState,
  removeScanLock,
  scanMediaFiles,
  writeScanState,
} from '@/services/api/scanner';
import { broadcastScanProgress } from '@/services/api/sse';
import { ScanState } from '@/types/Scan';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Retourner l'état actuel du scan
  if (req.method === 'GET') {
    const state = readScanState();
    if (state) {
      return res.status(200).json(state);
    }
    return res.status(200).json({
      isScanning: false,
      progress: 0,
      scanned: 0,
      total: 0,
      imagesCount: 0,
      videosCount: 0,
      deletedThumbs: 0,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier si un scan est déjà en cours
  if (isScanInProgress()) {
    const state = readScanState();
    return res.status(409).json({
      error: 'Scan already in progress',
      state,
    });
  }

  const mediaDirs = getMediaDirs();

  if (mediaDirs.length === 0) {
    return res.status(500).json({ error: 'MEDIA_DIRS not set' });
  }

  // Créer le fichier lock
  createScanLock();

  const startedAt = new Date().toISOString();

  try {
    // Scanner tous les fichiers médias
    const allMediaFiles = scanMediaFiles(mediaDirs);

    // Reconstruire le cache de fileIds
    rebuildFileCache(allMediaFiles);

    // Construire le Set des fileIds valides
    const validFileIds = buildValidFileIdsSet(allMediaFiles);

    // Nettoyer les thumbs orphelins
    const deletedThumbs = cleanOrphanThumbs(validFileIds);

    const total = allMediaFiles.length;
    const imagesCount = allMediaFiles.filter(({ filePath }) =>
      isImage(path.basename(filePath)),
    ).length;
    const videosCount = allMediaFiles.filter(({ filePath }) =>
      isVideo(path.basename(filePath)),
    ).length;

    // État initial du scan
    const initialState: ScanState = {
      isScanning: true,
      progress: 0,
      scanned: 0,
      total,
      imagesCount,
      videosCount,
      deletedThumbs,
      startedAt,
    };

    writeScanState(initialState);
    broadcastScanProgress(initialState);

    // Générer les thumbnails manquants avec callback de progression
    const { scanned } = await generateMissingThumbs(
      allMediaFiles,
      (currentScanned, currentTotal) => {
        const progressState: ScanState = {
          isScanning: true,
          progress: Math.round((currentScanned / currentTotal) * 100),
          scanned: currentScanned,
          total: currentTotal,
          imagesCount,
          videosCount,
          deletedThumbs,
          startedAt,
        };
        writeScanState(progressState);
        broadcastScanProgress(progressState);
      },
    );

    const completedAt = new Date().toISOString();

    // État final du scan
    const finalState: ScanState = {
      isScanning: false,
      progress: 100,
      scanned,
      total,
      imagesCount,
      videosCount,
      deletedThumbs,
      startedAt,
      completedAt,
    };

    writeScanState(finalState);
    broadcastScanProgress(finalState);

    console.log(
      `Scan terminé: ${scanned} thumbs générés, ${deletedThumbs} thumbs orphelins supprimés`,
    );

    // Supprimer le lock
    removeScanLock();

    res.status(200).json({ scanned, total, imagesCount, videosCount, deletedThumbs });
  } catch (error) {
    // En cas d'erreur, supprimer le lock et mettre à jour l'état
    removeScanLock();

    const errorState: ScanState = {
      isScanning: false,
      progress: 0,
      scanned: 0,
      total: 0,
      imagesCount: 0,
      videosCount: 0,
      deletedThumbs: 0,
      completedAt: new Date().toISOString(),
    };

    writeScanState(errorState);
    broadcastScanProgress(errorState);

    console.error('Erreur lors du scan:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
}
