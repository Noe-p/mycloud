import { Skeleton } from '@/components/ui/skeleton';
import { Grid10 } from '@/components/utils/Grid';
import React from 'react';

interface MediaGridSkeletonProps {
  count?: number;
}

export function MediaGridSkeleton({ count = 10 }: MediaGridSkeletonProps): React.JSX.Element {
  // Utilise la même grille que MediaGrid: 5 colonnes en mobile, 10 en md+
  return (
    <Grid10>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="aspect-square w-full rounded" />
      ))}
    </Grid10>
  );
}
