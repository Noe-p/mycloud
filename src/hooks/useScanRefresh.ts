import { useScanProgress } from '@/hooks/useScanProgress';
import React from 'react';

/**
 * Hook pour rafraîchir automatiquement les données quand un scan se termine
 */
export function useScanRefresh(onRefresh: () => void): void {
  const { scanProgress } = useScanProgress();
  const previousScanningRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const wasScanning = previousScanningRef.current;
    const isCurrentlyScanning = scanProgress?.isScanning ?? false;

    // Si on était en train de scanner et que maintenant on ne scanne plus, rafraîchir
    if (wasScanning && !isCurrentlyScanning && scanProgress?.progress === 100) {
      console.log('[useScanRefresh] Scan terminé, rafraîchissement...');
      onRefresh();
    }

    previousScanningRef.current = isCurrentlyScanning;
  }, [scanProgress?.isScanning, scanProgress?.progress, onRefresh]);
}
