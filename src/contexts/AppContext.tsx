'use client';

import React, { useState } from 'react';

export interface CurrentAlbum {
  name: string;
  mediaCount: number;
  subAlbumsCount: number;
}

interface State {
  isTransitionStartOpen: boolean;
  currentAlbum: CurrentAlbum | null;
}

interface Context extends State {
  setIsTransitionStartOpen: (open: boolean) => void;
  setCurrentAlbum: (album: CurrentAlbum | null) => void;
}

const defaultState: State = {
  isTransitionStartOpen: false,
  currentAlbum: null,
};

const AppContext = React.createContext<Context>({
  ...defaultState,
  setIsTransitionStartOpen: () => {
    throw new Error('AppContext.setIsTransitionStartOpen has not been set');
  },
  setCurrentAlbum: () => {
    throw new Error('AppContext.setCurrentAlbum has not been set');
  },
});

function useAppProvider() {
  const [isLoaded, setIsLoaded] = useState(defaultState.isTransitionStartOpen);
  const [currentAlbum, setCurrentAlbum] = useState<CurrentAlbum | null>(defaultState.currentAlbum);
  return {
    isTransitionStartOpen: isLoaded,
    setIsTransitionStartOpen: setIsLoaded,
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
