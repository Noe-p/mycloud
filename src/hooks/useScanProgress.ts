'use client';

import { ScanState } from '@/types/Scan';
import React from 'react';

export function useScanProgress() {
  const [scanProgress, setScanProgress] = React.useState<ScanState | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    // Créer la connexion SSE
    const eventSource = new EventSource('/api/scan-progress');

    eventSource.onmessage = (event) => {
      try {
        const data: unknown = event.data;
        if (typeof data !== 'string') return;

        const state = JSON.parse(data) as ScanState;

        // Ignorer le message de connexion initial
        if (
          'type' in state &&
          'type' in (state as Record<string, unknown>) &&
          (state as Record<string, unknown>).type === 'connected'
        ) {
          return;
        }

        setScanProgress(state);

        // Émettre un événement pour d'autres composants si nécessaire
        window.dispatchEvent(
          new CustomEvent('scanProgress', {
            detail: state,
          }),
        );
      } catch (error) {
        console.error('Erreur parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Erreur connexion SSE:', error);
      // Tenter de reconnecter automatiquement après 5 secondes
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Le EventSource se reconnecte automatiquement
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    // Cleanup à la déconnexion
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    scanProgress,
    isScanning: scanProgress?.isScanning ?? false,
    progress: scanProgress?.progress ?? 0,
    scanned: scanProgress?.scanned ?? 0,
    total: scanProgress?.total ?? 0,
  };
}
