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
        const data = typeof event.data === 'string' ? event.data : String(event.data);
        const parsed = JSON.parse(data) as unknown;

        // Ignorer le message de connexion initial
        if (
          parsed &&
          typeof parsed === 'object' &&
          'type' in (parsed as Record<string, unknown>) &&
          (parsed as Record<string, unknown>).type === 'connected'
        ) {
          return;
        }

        const state = parsed as ScanState;

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
      // Ne pas fermer la connexion: EventSource gère la reconnexion automatiquement.
      // Le serveur envoie aussi 'retry: 5000' pour suggérer un délai de reconnexion.
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
