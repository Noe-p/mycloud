import { AlbumCard } from '@/components/Albums/AlbumCard';
import { SubAlbumsListSkeleton } from '@/components/Albums/SubAlbumsListSkeleton';
import { Col } from '@/components/utils/Flex';
import { Album } from '@/types/Album';
import React from 'react';

interface SubAlbumsListProps {
  subAlbums: Album[];
  isLoading?: boolean;
  expectedCount?: number;
}

export function SubAlbumsList({
  subAlbums,
  isLoading = false,
  expectedCount,
}: SubAlbumsListProps): React.JSX.Element | null {
  if (isLoading) {
    // Si on connaît le nombre attendu, on l'utilise strictement
    if (typeof expectedCount === 'number') {
      // Si le nombre attendu est 0, ne rien afficher (pas de skeleton inutile)
      if (expectedCount <= 0) return null;
      return <SubAlbumsListSkeleton count={expectedCount} />;
    }
    // Sinon, fallback sur une valeur par défaut raisonnable
    return <SubAlbumsListSkeleton count={3} />;
  }

  if (subAlbums.length === 0) {
    return null;
  }

  return (
    <Col className="gap-2">
      {subAlbums.map((subAlbum) => (
        <AlbumCard key={subAlbum.id} album={subAlbum} />
      ))}
    </Col>
  );
}
