import { Col, Row, RowCenter } from '@/components/utils/Flex';
import { H3, P14 } from '@/components/utils/Texts';
import { Album } from '@/types/Album';
import { ChevronRight, Folder } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps): React.JSX.Element {
  const t = useTranslations('common.album');
  const albumUrl = `/albums/${encodeURIComponent(album.relativePath || album.name)}`;

  return (
    <Link
      key={album.id}
      href={albumUrl}
      className="block group hover:bg-secondary/50 rounded-lg p-3 transition-all border border-border hover:border-primary/50"
    >
      <Row className="items-center gap-4">
        {/* Album cover thumbnail */}
        <div className="relative w-24 h-24 bg-card rounded-lg overflow-hidden flex-shrink-0 border border-border">
          {album.coverThumb ? (
            <Image
              src={album.coverThumb}
              alt={album.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <RowCenter className="w-full h-full text-muted-foreground justify-center">
              <Folder className="w-8 h-8" />
            </RowCenter>
          )}
        </div>

        {/* Album information */}
        <Col className="flex-1 min-w-0 gap-1">
          <H3 className="text-foreground group-hover:text-primary transition-colors truncate">
            {album.name}
          </H3>
          <P14 className="text-muted-foreground">
            {album.mediaCount} {album.mediaCount === 1 ? t('media') : t('medias')}
            {album.subAlbums.length > 0 &&
              ` • ${album.subAlbums.length} ${
                album.subAlbums.length === 1 ? t('subAlbum') : t('subAlbums')
              }`}
          </P14>
        </Col>

        {/* Navigation icon */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </Row>
    </Link>
  );
}
