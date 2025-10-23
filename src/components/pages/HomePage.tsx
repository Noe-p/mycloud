'use client';

import { AlbumCard } from '@/components/Albums/AlbumCard';
import { SpinnerLoader } from '@/components/Loaders/SpinnerLoader';
import { Layout } from '@/components/utils/Layout';
import { P16 } from '@/components/utils/Texts';
import { useAppContext } from '@/contexts';
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
  const { setCurrentAlbum, setMediaCounts } = useAppContext();

  // Réinitialiser l'album actuel sur la page d'accueil
  React.useEffect(() => {
    setCurrentAlbum(null);
  }, [setCurrentAlbum]);

  React.useEffect(() => {
    void fetch('/api/albums')
      .then((res) => res.json())
      .then((data: { albums: Album[] }) => {
        setAlbums(data.albums);

        // Compter seulement les médias et albums visibles (niveau racine)
        let totalMedias = 0;
        data.albums.forEach((album) => {
          totalMedias += album.mediaCount;
        });

        setMediaCounts({
          total: totalMedias,
          images: 0,
          videos: 0,
          totalMedias,
          totalAlbums: 0, // Pas d'albums affichés sur la home
        });

        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading albums:', error);
        setIsLoading(false);
      });
  }, [setMediaCounts]);

  console.log(albums);

  if (isLoading) {
    return (
      <Layout className="md:px-10 px-2">
        <SpinnerLoader className="mt-22 h-64" />
      </Layout>
    );
  }

  return (
    <Layout className="md:px-10 px-2">
      <div className="mt-22">
        {albums.length == 0 ? (
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
