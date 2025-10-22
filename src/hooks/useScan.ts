'use client';

import { useAppContext } from '@/contexts';
import { MediaCounts } from '@/contexts/AppContext';
import { Media } from '@/types/Media';
import { ScanResponse } from '@/types/Scan';
import React from 'react';

export function useScan() {
  const [loading, setLoading] = React.useState(false);
  const { setMediaCounts } = useAppContext();
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = React.useRef(false);

  type ThumbsResponse = {
    thumbs: Media[];
    total?: number;
    hasMore?: boolean;
    offset?: number;
    limit?: number;
  };
  const isThumbsResponse = (val: unknown): val is ThumbsResponse => {
    if (!val || typeof val !== 'object') return false;
    const v = val as { thumbs?: unknown };
    return Array.isArray(v.thumbs);
  };

  const computeCounts = (total: number, items: Media[]): MediaCounts => {
    let images = 0;
    let videos = 0;
    for (const m of items) {
      if (m.type === 'image') images += 1;
      else if (m.type === 'video') videos += 1;
    }
    return { total, images, videos };
  };

  const fetchThumbs = async (emitEvent = false, limit = 100, offset = 0): Promise<Media[]> => {
    if (isFetchingRef.current) return [];
    isFetchingRef.current = true;
    try {
      const res = await fetch(`/api/thumbs?limit=${limit}&offset=${offset}`);
      const json: unknown = await res.json();
      if (isThumbsResponse(json)) {
        const sorted = [...json.thumbs].sort((a, b) => {
          const at = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bt - at; // newest first, oldest last
        });

        // Utiliser le total du serveur pour les counts
        const totalCount = json.total || sorted.length;
        setMediaCounts(computeCounts(totalCount, sorted));

        // Émettre un événement pour mettre à jour l'UI en temps réel
        if (emitEvent) {
          window.dispatchEvent(
            new CustomEvent('mediasRefreshed', {
              detail: {
                thumbs: sorted,
                total: totalCount,
                hasMore: json.hasMore || false,
              },
            }),
          );
        }

        // Stop polling early if all thumbnails are ready
        const allReady = sorted.length > 0 && sorted.every((m) => !!m.thumbReady);
        if (allReady && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return sorted;
      }
      setMediaCounts({ total: 0, images: 0, videos: 0 });
      return [];
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const isScanResponse = (val: unknown): val is ScanResponse => {
    return (
      !!val && typeof val === 'object' && typeof (val as { scanned?: unknown }).scanned === 'number'
    );
  };

  const handleScan = async (): Promise<Media[]> => {
    setLoading(true);

    // Récupérer la liste initiale pour créer les placeholders
    await fetchThumbs(true);

    // Start polling thumbs while scan is running
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        void fetchThumbs(true); // Émettre l'événement à chaque polling
      }, 1000);
    }

    const res = await fetch('/api/scan', { method: 'POST' });
    const scanJson: unknown = await res.json();
    if (isScanResponse(scanJson)) {
      const { total, imagesCount, videosCount } = scanJson;
      if (
        typeof total === 'number' &&
        typeof imagesCount === 'number' &&
        typeof videosCount === 'number'
      ) {
        const counts: MediaCounts = { total, images: imagesCount, videos: videosCount };
        setMediaCounts(counts);
      }
    }
    const thumbs = await fetchThumbs(true);
    // Stop polling after scan completes
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLoading(false);

    return thumbs;
  };

  return { handleScan, fetchThumbs, loading };
}
