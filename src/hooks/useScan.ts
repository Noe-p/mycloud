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

  type ThumbsResponse = { thumbs: Media[] };
  const isThumbsResponse = (val: unknown): val is ThumbsResponse => {
    if (!val || typeof val !== 'object') return false;
    const v = val as { thumbs?: unknown };
    return Array.isArray(v.thumbs);
  };

  const computeCounts = (items: Media[]): MediaCounts => {
    let images = 0;
    let videos = 0;
    for (const m of items) {
      if (m.type === 'image') images += 1;
      else if (m.type === 'video') videos += 1;
    }
    return { total: items.length, images, videos };
  };

  const fetchThumbs = async (): Promise<Media[]> => {
    if (isFetchingRef.current) return [];
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/thumbs');
      const json: unknown = await res.json();
      if (isThumbsResponse(json)) {
        const sorted = [...json.thumbs].sort((a, b) => {
          const at = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bt - at; // newest first, oldest last
        });
        setMediaCounts(computeCounts(sorted));
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
    // Start polling thumbs while scan is running
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        void fetchThumbs();
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
    const thumbs = await fetchThumbs();
    // Stop polling after scan completes
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLoading(false);

    // Émettre un événement pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('mediasRefreshed', { detail: { thumbs } }));

    return thumbs;
  };

  return { handleScan, fetchThumbs, loading };
}
