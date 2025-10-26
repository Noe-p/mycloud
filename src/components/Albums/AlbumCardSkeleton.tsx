import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

export function AlbumCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32 md:w-40" />
        <Skeleton className="h-4 w-24 md:w-32" />
      </div>
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  );
}
