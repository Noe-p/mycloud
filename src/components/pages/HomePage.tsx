'use client';

import { AlbumCard } from '@/components/Albums/AlbumCard';
import { AlbumCardSkeleton } from '@/components/Albums/AlbumCardSkeleton';
import { Layout } from '@/components/utils/Layout';
import { P16 } from '@/components/utils/Texts';
import { useAlbumsContext, useAppContext } from '@/contexts';
import { useScanProgress } from '@/hooks/useScanProgress';
import { useTranslations } from 'next-intl';
import React from 'react';

interface Album {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  mediaCount: number;
  subAlbums: Album[];
  coverThumb?: string | undefined;
  hasMedia: boolean;
}

export function HomePage(): React.JSX.Element {
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const tCommons = useTranslations('common');
  const { setCurrentAlbum } = useAppContext();
  const { setAlbumCounts } = useAlbumsContext();
  const { scanProgress } = useScanProgress();
  const previousScanningRef = React.useRef<boolean>(false);
  const previousAlbumCountRef = React.useRef<number>(0);

  // Réinitialiser l'album actuel sur la page d'accueil
  React.useEffect(() => {
    setCurrentAlbum(null);
  }, [setCurrentAlbum]);

  const loadAlbums = React.useCallback(() => {
    setIsLoading(true);
    void fetch('/api/albums')
      .then((res) => res.json())
      .then((data: { albums: Album[] }) => {
        setAlbums(data.albums);
        previousAlbumCountRef.current = data.albums.length;

        // Compter seulement les médias et albums visibles (niveau racine)
        let totalMedias = 0;
        data.albums.forEach((album) => {
          totalMedias += album.mediaCount;
        });

        setAlbumCounts({
          totalMedias,
          totalAlbums: 0, // Pas d'albums affichés sur la home
        });

        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading albums:', error);
        setIsLoading(false);
      });
  }, [setAlbumCounts]);

  React.useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Rafraîchir les albums quand le scan se termine
  React.useEffect(() => {
    const wasScanning = previousScanningRef.current;
    const isCurrentlyScanning = scanProgress?.isScanning ?? false;

    // Si on était en train de scanner et que maintenant on ne scanne plus, rafraîchir
    if (wasScanning && !isCurrentlyScanning && scanProgress?.progress === 100) {
      console.log('[HomePage] Scan terminé, rafraîchissement des albums...');
      loadAlbums();
    }

    previousScanningRef.current = isCurrentlyScanning;
  }, [scanProgress?.isScanning, scanProgress?.progress, loadAlbums]);

  console.log(albums);

  // Nombre de skeletons à afficher : utilise le nombre précédent ou une valeur par défaut
  const skeletonCount = previousAlbumCountRef.current > 0 ? previousAlbumCountRef.current : 5;

  return (
    <Layout className="md:px-10 px-2" isProtected>
      <div className="mt-22">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <AlbumCardSkeleton key={index} />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-12">
            <P16 className="italic text-muted-foreground">{tCommons('generics.noAlbum')}</P16>
          </div>
        ) : (
          <div className="space-y-2">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
