import { AlbumCard } from '@/components/Albums/AlbumCard';
import { Col } from '@/components/utils/Flex';
import { Album } from '@/types/Album';
import React from 'react';

interface SubAlbumsListProps {
  subAlbums: Album[];
}

export function SubAlbumsList({ subAlbums }: SubAlbumsListProps): React.JSX.Element | null {
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
