'use client';

import React, { useState } from 'react';

export interface MediaCounts {
  total: number;
  images: number;
  videos: number;
}

interface State {
  isTransitionStartOpen: boolean;
  mediaCounts: MediaCounts;
}

interface Context extends State {
  setIsTransitionStartOpen: (open: boolean) => void;
  setMediaCounts: (counts: MediaCounts) => void;
}

const defaultState: State = {
  isTransitionStartOpen: false,
  mediaCounts: { total: 0, images: 0, videos: 0 },
};

const AppContext = React.createContext<Context>({
  ...defaultState,
  setIsTransitionStartOpen: () => {
    throw new Error('AppContext.setIsTransitionStartOpen has not been set');
  },
  setMediaCounts: () => {
    throw new Error('AppContext.setMediaCounts has not been set');
  },
});

function useAppProvider() {
  const [isLoaded, setIsLoaded] = useState(defaultState.isTransitionStartOpen);
  const [mediaCounts, setMediaCounts] = useState<MediaCounts>(defaultState.mediaCounts);
  return {
    isTransitionStartOpen: isLoaded,
    setIsTransitionStartOpen: setIsLoaded,
    mediaCounts,
    setMediaCounts,
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
