'use client';

import { AlbumCard } from '@/components/Albums/AlbumCard';
import { Loader } from '@/components/Loaders/Loader';
import { SpinnerLoader } from '@/components/Loaders/SpinnerLoader';
import { MediaGrid } from '@/components/Medias/MediaGrid';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Col } from '@/components/utils/Flex';
import { Layout } from '@/components/utils/Layout';
import { P16 } from '@/components/utils/Texts';
import { useAppContext } from '@/contexts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Media } from '@/types/Media';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

const ITEMS_PER_PAGE = 50;

interface Album {
  id: string;
  name: string;
  relativePath: string;
  mediaCount: number;
  subAlbums: Album[];
  coverThumb?: string | undefined;
  hasMedia: boolean;
}

export function AlbumDetailPage(): React.JSX.Element {
  const params = useParams();
  const albumPath = params?.albumPath as string;
  const t = useTranslations('common');
  const { setCurrentAlbum } = useAppContext();

  const [medias, setMedias] = React.useState<Media[]>([]);
  const [displayedMedias, setDisplayedMedias] = React.useState<Media[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const [hasMoreOnServer, setHasMoreOnServer] = React.useState(true);
  const [albumInfo, setAlbumInfo] = React.useState<Album | null>(null);
  const [subAlbums, setSubAlbums] = React.useState<Album[]>([]);
  const [breadcrumbPath, setBreadcrumbPath] = React.useState<Array<{ name: string; path: string }>>(
    [],
  );

  // Charger les informations de l'album et ses sous-albums
  React.useEffect(() => {
    void fetch('/api/albums')
      .then((res) => res.json())
      .then((data: { albums: Album[] }) => {
        // Trouver l'album correspondant dans l'arborescence et construire le chemin
        const findAlbumWithPath = (
          albums: Album[],
          path: string,
          currentPath: Array<{ name: string; path: string }> = [],
        ): { album: Album | null; breadcrumb: Array<{ name: string; path: string }> } => {
          for (const album of albums) {
            const albumPathToMatch = album.relativePath || album.name;
            const newPath = [
              ...currentPath,
              {
                name: album.name,
                path: `/albums/${encodeURIComponent(albumPathToMatch)}`,
              },
            ];

            if (albumPathToMatch === path) {
              return { album, breadcrumb: newPath };
            }

            if (album.subAlbums.length > 0) {
              const result = findAlbumWithPath(album.subAlbums, path, newPath);
              if (result.album) return result;
            }
          }
          return { album: null, breadcrumb: [] };
        };

        const decodedPath = decodeURIComponent(albumPath);
        const { album, breadcrumb } = findAlbumWithPath(data.albums, decodedPath);

        if (album) {
          setAlbumInfo(album);
          setSubAlbums(album.subAlbums);
          setBreadcrumbPath(breadcrumb);
        }
      })
      .catch((error) => {
        console.error('Error loading album info:', error);
      });
  }, [albumPath]);

  // Réinitialiser l'album actuel quand on quitte la page
  React.useEffect(() => {
    return () => {
      setCurrentAlbum(null);
    };
  }, [setCurrentAlbum]);

  // Charger les médias de l'album
  React.useEffect(() => {
    setIsLoading(true);
    void fetch(`/api/albums/${albumPath}?limit=50&offset=0`)
      .then((res) => res.json())
      .then(
        (data: {
          medias: Media[];
          total: number;
          hasMore: boolean;
          offset: number;
          limit: number;
        }) => {
          setMedias(data.medias);
          setDisplayedMedias(data.medias.slice(0, ITEMS_PER_PAGE));
          setTotalCount(data.total);
          setHasMoreOnServer(data.hasMore);
          setCurrentPage(1);
          setIsLoading(false);
        },
      )
      .catch((error) => {
        console.error('Error loading album medias:', error);
        setIsLoading(false);
      });
  }, [albumPath]);

  // Mettre à jour le contexte quand on a les infos complètes
  React.useEffect(() => {
    if (albumInfo) {
      setCurrentAlbum({
        name: albumInfo.name,
        mediaCount: totalCount, // Nombre de médias directs uniquement
        subAlbumsCount: subAlbums.length, // Nombre de sous-albums
      });
    }
  }, [albumInfo, totalCount, subAlbums.length, setCurrentAlbum]);

  const hasMore = displayedMedias.length < medias.length || hasMoreOnServer;

  const loadMore = React.useCallback(() => {
    if (isLoadingMore) return;

    // Charger plus depuis le serveur si nécessaire
    if (displayedMedias.length >= medias.length && hasMoreOnServer && medias.length > 0) {
      setIsLoadingMore(true);
      void fetch(`/api/albums/${albumPath}?limit=50&offset=${medias.length}`)
        .then((res) => res.json())
        .then(
          (data: {
            medias: Media[];
            total: number;
            hasMore: boolean;
            offset: number;
            limit: number;
          }) => {
            const combined = [...medias, ...data.medias];
            setMedias(combined);
            setDisplayedMedias(combined.slice(0, displayedMedias.length + ITEMS_PER_PAGE));
            setHasMoreOnServer(data.hasMore);
            setIsLoadingMore(false);
          },
        );
      return;
    }

    // Afficher plus d'éléments déjà chargés
    if (displayedMedias.length >= medias.length) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const end = nextPage * ITEMS_PER_PAGE;
      setDisplayedMedias(medias.slice(0, end));
      setCurrentPage(nextPage);
      setIsLoadingMore(false);
    }, 300);
  }, [currentPage, medias, displayedMedias.length, hasMoreOnServer, isLoadingMore, albumPath]);

  const { observerTarget } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  });

  if (isLoading) {
    return (
      <Layout className="md:px-10 px-2">
        <SpinnerLoader className="mt-22 h-64" />
      </Layout>
    );
  }

  return (
    <Layout className="md:px-10 px-2">
      <Col className="mt-22 gap-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t('navbar.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbPath.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.path}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbPath.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumb.path}>{breadcrumb.name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Sub-albums section */}
        {subAlbums.length > 0 && (
          <div className="space-y-2">
            {subAlbums.map((subAlbum) => (
              <AlbumCard key={subAlbum.id} album={subAlbum} />
            ))}
          </div>
        )}

        {/* Media grid section */}
        {displayedMedias.length > 0 ? (
          <Col className="gap-4">
            <MediaGrid medias={displayedMedias} />

            {/* Sentinel for infinite scroll */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isLoadingMore && <Loader />}
            </div>

            {/* End message */}
            {!hasMore && !hasMoreOnServer && (
              <div className="text-center py-8">
                <P16 className="text-muted-foreground">
                  {t('album.allMediasLoaded', { count: totalCount })}
                </P16>
              </div>
            )}
          </Col>
        ) : (
          subAlbums.length === 0 && (
            <div className="text-center py-12">
              <P16 className="italic text-muted-foreground">{t('album.noMedia')}</P16>
            </div>
          )
        )}
      </Col>
    </Layout>
  );
}
