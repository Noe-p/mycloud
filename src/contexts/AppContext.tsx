'use client';

import React, { useState } from 'react';

export interface MediaCounts {
  total: number;
  images: number;
  videos: number;
  totalMedias?: number;
  totalAlbums?: number;
}

export interface CurrentAlbum {
  name: string;
  mediaCount: number;
  subAlbumsCount: number;
}

interface State {
  isTransitionStartOpen: boolean;
  mediaCounts: MediaCounts;
  currentAlbum: CurrentAlbum | null;
}

interface Context extends State {
  setIsTransitionStartOpen: (open: boolean) => void;
  setMediaCounts: (counts: MediaCounts) => void;
  setCurrentAlbum: (album: CurrentAlbum | null) => void;
}

const defaultState: State = {
  isTransitionStartOpen: false,
  mediaCounts: { total: 0, images: 0, videos: 0 },
  currentAlbum: null,
};

const AppContext = React.createContext<Context>({
  ...defaultState,
  setIsTransitionStartOpen: () => {
    throw new Error('AppContext.setIsTransitionStartOpen has not been set');
  },
  setMediaCounts: () => {
    throw new Error('AppContext.setMediaCounts has not been set');
  },
  setCurrentAlbum: () => {
    throw new Error('AppContext.setCurrentAlbum has not been set');
  },
});

function useAppProvider() {
  const [isLoaded, setIsLoaded] = useState(defaultState.isTransitionStartOpen);
  const [mediaCounts, setMediaCounts] = useState<MediaCounts>(defaultState.mediaCounts);
  const [currentAlbum, setCurrentAlbum] = useState<CurrentAlbum | null>(defaultState.currentAlbum);
  return {
    isTransitionStartOpen: isLoaded,
    setIsTransitionStartOpen: setIsLoaded,
    mediaCounts,
    setMediaCounts,
    currentAlbum,
    setCurrentAlbum,
  };
}

interface Props {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: Props): React.JSX.Element => {
  const context = useAppProvider();

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

export const useAppContext = (): Context => React.useContext(AppContext);
