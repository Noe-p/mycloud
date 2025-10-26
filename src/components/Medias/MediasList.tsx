import { MediaGrid } from '@/components/Medias/MediaGrid';
import { MediaGridSkeleton } from '@/components/Medias/MediaGridSkeleton';
import { Col } from '@/components/utils/Flex';
import { P16 } from '@/components/utils/Texts';
import { Media } from '@/types/Media';
import { useTranslations } from 'next-intl';
import React from 'react';

interface MediasListProps {
  medias: Media[];
  hasMore: boolean;
  hasMoreOnServer: boolean;
  isLoadingMore: boolean;
  totalCount: number;
  observerTarget: React.RefObject<HTMLDivElement | null>;
}

export function MediasList({
  medias,
  hasMore,
  hasMoreOnServer,
  isLoadingMore,
  totalCount,
  observerTarget,
}: MediasListProps): React.JSX.Element {
  const t = useTranslations('common');

  return (
    <Col className="gap-4">
      <MediaGrid medias={medias} />

      {/* Sentinel for infinite scroll with skeleton loader */}
      <div ref={observerTarget}>{isLoadingMore && <MediaGridSkeleton count={10} />}</div>

      {/* End message */}
      {!hasMore && !hasMoreOnServer && (
        <div className="text-center py-8">
          <P16 className="text-muted-foreground">
            {t('album.allMediasLoaded', { count: totalCount })}
          </P16>
        </div>
      )}
    </Col>
  );
}
