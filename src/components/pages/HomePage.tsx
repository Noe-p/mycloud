'use client';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useScan } from '@/hooks/useScan';
import { Media } from '@/types/Media';
import React from 'react';
import { Loader } from '../Loaders/Loader';
import { MediaGrid } from '../Medias/MediaGrid';
import { Layout } from '../utils/Layout';

const ITEMS_PER_PAGE = 50; // Nombre d'images à charger par batch

export function HomePage(): React.JSX.Element {
  const [allThumbs, setAllThumbs] = React.useState<Media[]>([]);
  const [displayedThumbs, setDisplayedThumbs] = React.useState<Media[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const { fetchThumbs } = useScan();

  // Chargement initial des thumbnails
  React.useEffect(() => {
    void fetchThumbs().then((thumbs) => {
      setAllThumbs(thumbs);
      setDisplayedThumbs(thumbs.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
    });
  }, []);

  // Écouter les événements de rafraîchissement (après un scan)
  React.useEffect(() => {
    const handleMediasRefresh = (event: CustomEvent<{ thumbs: Media[] }>) => {
      const thumbs = event.detail.thumbs;
      setAllThumbs(thumbs);
      setDisplayedThumbs(thumbs.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
    };

    window.addEventListener('mediasRefreshed', handleMediasRefresh as EventListener);

    return () => {
      window.removeEventListener('mediasRefreshed', handleMediasRefresh as EventListener);
    };
  }, []);

  const hasMore = displayedThumbs.length < allThumbs.length;

  const loadMore = React.useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simuler un petit délai pour un chargement plus fluide
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const start = 0;
      const end = nextPage * ITEMS_PER_PAGE;
      setDisplayedThumbs(allThumbs.slice(start, end));
      setCurrentPage(nextPage);
      setIsLoadingMore(false);
    }, 300);
  }, [currentPage, allThumbs, hasMore, isLoadingMore]);

  const { observerTarget } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  });

  return (
    <Layout className="md:px-10">
      <div className="mt-22">
        <MediaGrid medias={displayedThumbs} />

        {/* Sentinel pour l'infinite scroll */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isLoadingMore && <Loader />}
        </div>

        {/* Message de fin */}
        {!hasMore && allThumbs.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Toutes les photos ont été chargées ({allThumbs.length} au total)
          </div>
        )}
      </div>
    </Layout>
  );
}
