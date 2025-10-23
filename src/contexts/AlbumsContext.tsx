'use client';

import React, { useState } from 'react';

export interface AlbumCounts {
  totalMedias: number;
  totalAlbums: number;
}

interface State {
  albumCounts: AlbumCounts;
}

interface Context extends State {
  setAlbumCounts: (counts: AlbumCounts) => void;
}

const defaultState: State = {
  albumCounts: { totalMedias: 0, totalAlbums: 0 },
};

const AlbumsContext = React.createContext<Context>({
  ...defaultState,
  setAlbumCounts: () => {
    throw new Error('AlbumsContext.setAlbumCounts has not been set');
  },
});

function useAlbumsProvider() {
  const [albumCounts, setAlbumCounts] = useState<AlbumCounts>(defaultState.albumCounts);
  return {
    albumCounts,
    setAlbumCounts,
  };
}

interface Props {
  children: React.ReactNode;
}

export const AlbumsProvider = ({ children }: Props): React.JSX.Element => {
  const context = useAlbumsProvider();

  return <AlbumsContext.Provider value={context}>{children}</AlbumsContext.Provider>;
};

export const useAlbumsContext = (): Context => React.useContext(AlbumsContext);
