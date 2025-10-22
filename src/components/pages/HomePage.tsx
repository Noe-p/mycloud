'use client';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useScan } from '@/hooks/useScan';
import { Media } from '@/types/Media';
import { useTranslations } from 'next-intl';
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
  const [totalMediaCount, setTotalMediaCount] = React.useState(0);
  const [hasMoreOnServer, setHasMoreOnServer] = React.useState(true);
  const { fetchThumbs } = useScan();
  const tCommons = useTranslations('common');

  // Chargement initial des thumbnails (100 premiers)
  React.useEffect(() => {
    void fetchThumbs(false, 100, 0).then((thumbs) => {
      setAllThumbs(thumbs);
      setDisplayedThumbs(thumbs.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
      // Le total sera mis à jour via l'événement ou on peut le récupérer directement
    });
  }, []);

  // Écouter les événements de rafraîchissement (après un scan)
  React.useEffect(() => {
    const handleMediasRefresh = (
      event: CustomEvent<{ thumbs: Media[]; total?: number; hasMore?: boolean }>,
    ) => {
      const { thumbs, total, hasMore } = event.detail;
      setAllThumbs(thumbs);
      setDisplayedThumbs(thumbs.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
      if (total !== undefined) setTotalMediaCount(total);
      if (hasMore !== undefined) setHasMoreOnServer(hasMore);
    };

    window.addEventListener('mediasRefreshed', handleMediasRefresh as EventListener);

    return () => {
      window.removeEventListener('mediasRefreshed', handleMediasRefresh as EventListener);
    };
  }, []);

  const hasMore = displayedThumbs.length < allThumbs.length || hasMoreOnServer;

  const loadMore = React.useCallback(() => {
    if (isLoadingMore) return;

    // Si on a affiché tout ce qu'on a chargé du serveur ET qu'il y a plus de données côté serveur
    if (displayedThumbs.length >= allThumbs.length && hasMoreOnServer && allThumbs.length > 0) {
      setIsLoadingMore(true);
      // Charger plus de données depuis le serveur
      void fetchThumbs(false, 100, allThumbs.length).then((newThumbs) => {
        const combined = [...allThumbs, ...newThumbs];
        setAllThumbs(combined);
        setDisplayedThumbs(combined.slice(0, displayedThumbs.length + ITEMS_PER_PAGE));
        setHasMoreOnServer(newThumbs.length === 100); // S'il y a moins de 100, on a tout chargé
        setIsLoadingMore(false);
      });
      return;
    }

    // Sinon, afficher plus d'éléments déjà chargés
    if (displayedThumbs.length >= allThumbs.length) return;

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
  }, [currentPage, allThumbs, displayedThumbs.length, hasMoreOnServer, isLoadingMore, fetchThumbs]);

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
        {!hasMore && !hasMoreOnServer && allThumbs.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {tCommons('home.allImagesLoaded', { count: totalMediaCount || allThumbs.length })}
          </div>
        )}
      </div>
    </Layout>
  );
}
