import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

export function AlbumBreadcrumbSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">{'>'}</span>
      <Skeleton className="h-4 w-24" />
      <span className="text-muted-foreground">{'>'}</span>
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
