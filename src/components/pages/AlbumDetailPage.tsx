'use client';

import { AlbumBreadcrumb } from '@/components/Albums/AlbumBreadcrumb';
import { EmptyAlbumState } from '@/components/Albums/EmptyAlbumState';
import { SubAlbumsList } from '@/components/Albums/SubAlbumsList';
import { MediaGridSkeleton } from '@/components/Medias/MediaGridSkeleton';
import { MediasList } from '@/components/Medias/MediasList';
import { Col } from '@/components/utils/Flex';
import { Layout } from '@/components/utils/Layout';
import { useAppContext } from '@/contexts';
import { useAlbumData } from '@/hooks/useAlbumData';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useScanRefresh } from '@/hooks/useScanRefresh';
import { useParams } from 'next/navigation';
import React from 'react';

export function AlbumDetailPage(): React.JSX.Element {
  const params = useParams();
  const albumPath = params?.albumPath as string;
  const { setCurrentAlbum } = useAppContext();

  // Charger les données de l'album
  const {
    displayedMedias,
    isLoading,
    isLoadingMore,
    totalCount,
    hasMoreOnServer,
    albumInfo,
    subAlbums,
    breadcrumbPath,
    hasMore,
    loadMore,
    refresh,
  } = useAlbumData(albumPath);

  // Rafraîchir quand le scan se termine
  useScanRefresh(refresh);

  // Infinite scroll
  const { observerTarget } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  });

  // Mettre à jour le contexte avec les infos de l'album
  React.useEffect(() => {
    if (albumInfo) {
      setCurrentAlbum({
        name: albumInfo.name,
        mediaCount: totalCount,
        subAlbumsCount: subAlbums.length,
      });
    }
  }, [albumInfo, totalCount, subAlbums.length, setCurrentAlbum]);

  // Réinitialiser l'album actuel quand on quitte la page
  React.useEffect(() => {
    return () => {
      setCurrentAlbum(null);
    };
  }, [setCurrentAlbum]);

  const hasContent = displayedMedias.length > 0 || subAlbums.length > 0;

  // Calculer le nombre de skeletons à afficher
  const mediaSkeletonCount = totalCount > 0 ? Math.min(totalCount, 12) : 12;
  const subAlbumsSkeletonCount = albumInfo?.subAlbums?.length || 0;

  return (
    <Layout className="md:px-10 px-2" isProtected>
      <Col className="mt-22 gap-8">
        <AlbumBreadcrumb
          breadcrumbPath={breadcrumbPath}
          isLoading={isLoading && breadcrumbPath.length === 0}
        />

        <SubAlbumsList
          subAlbums={subAlbums}
          isLoading={isLoading && subAlbums.length === 0}
          expectedCount={subAlbumsSkeletonCount}
        />

        {isLoading && displayedMedias.length === 0 ? (
          <MediaGridSkeleton count={mediaSkeletonCount} />
        ) : displayedMedias.length > 0 ? (
          <MediasList
            medias={displayedMedias}
            hasMore={hasMore}
            hasMoreOnServer={hasMoreOnServer}
            isLoadingMore={isLoadingMore}
            totalCount={totalCount}
            observerTarget={observerTarget}
          />
        ) : null}

        {!isLoading && !hasContent && <EmptyAlbumState />}
      </Col>
    </Layout>
  );
}
