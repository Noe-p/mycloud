import { Album, BreadcrumbItem } from '@/types/Album';
import { Media } from '@/types/Media';
import React from 'react';

const ITEMS_PER_PAGE = 50;

interface AlbumDataState {
  medias: Media[];
  displayedMedias: Media[];
  currentPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  totalCount: number;
  hasMoreOnServer: boolean;
  albumInfo: Album | null;
  subAlbums: Album[];
  breadcrumbPath: BreadcrumbItem[];
}

interface UseAlbumDataReturn extends AlbumDataState {
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

function findAlbumWithPath(
  albums: Album[],
  path: string,
  currentPath: BreadcrumbItem[] = [],
): { album: Album | null; breadcrumb: BreadcrumbItem[] } {
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
}

export function useAlbumData(albumPath: string): UseAlbumDataReturn {
  const [medias, setMedias] = React.useState<Media[]>([]);
  const [displayedMedias, setDisplayedMedias] = React.useState<Media[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const [hasMoreOnServer, setHasMoreOnServer] = React.useState(true);
  const [albumInfo, setAlbumInfo] = React.useState<Album | null>(null);
  const [subAlbums, setSubAlbums] = React.useState<Album[]>([]);
  const [breadcrumbPath, setBreadcrumbPath] = React.useState<BreadcrumbItem[]>([]);
  const subAlbumsCountRef = React.useRef<number>(0);

  // Charger les informations de l'album et ses sous-albums
  const loadAlbumInfo = React.useCallback(() => {
    void fetch('/api/albums')
      .then((res) => res.json())
      .then((data: { albums: Album[] }) => {
        const decodedPath = decodeURIComponent(albumPath);
        const { album, breadcrumb } = findAlbumWithPath(data.albums, decodedPath);

        if (album) {
          setAlbumInfo(album);
          // Stocker le nombre de sous-albums avant de les afficher
          subAlbumsCountRef.current = album.subAlbums.length;
          setSubAlbums(album.subAlbums);
          setBreadcrumbPath(breadcrumb);
          // Mettre immédiatement à jour le total count avec les infos de l'album
          setTotalCount(album.mediaCount);
        }
      })
      .catch((error) => {
        console.error('Error loading album info:', error);
      });
  }, [albumPath]);

  // Charger les médias de l'album
  const loadMedias = React.useCallback(() => {
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

  const refresh = React.useCallback(() => {
    loadMedias();
    loadAlbumInfo();
  }, [loadMedias, loadAlbumInfo]);

  React.useEffect(() => {
    loadAlbumInfo();
  }, [loadAlbumInfo]);

  React.useEffect(() => {
    loadMedias();
  }, [loadMedias]);

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

  return {
    medias,
    displayedMedias,
    currentPage,
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
  };
}
