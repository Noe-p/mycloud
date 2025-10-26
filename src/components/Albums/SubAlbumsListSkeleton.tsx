import { AlbumCardSkeleton } from '@/components/Albums/AlbumCardSkeleton';
import { Col } from '@/components/utils/Flex';
import React from 'react';

interface SubAlbumsListSkeletonProps {
  count?: number;
}

export function SubAlbumsListSkeleton({
  count = 3,
}: SubAlbumsListSkeletonProps): React.JSX.Element {
  return (
    <Col className="gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <AlbumCardSkeleton key={index} />
      ))}
    </Col>
  );
}
