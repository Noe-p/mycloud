'use client';

import React, { useState } from 'react';

export interface MediaCounts {
  total: number;
  images: number;
  videos: number;
}

interface State {
  mediaCounts: MediaCounts;
}

interface Context extends State {
  setMediaCounts: (counts: MediaCounts) => void;
}

const defaultState: State = {
  mediaCounts: { total: 0, images: 0, videos: 0 },
};

const MediaContext = React.createContext<Context>({
  ...defaultState,
  setMediaCounts: () => {
    throw new Error('MediaContext.setMediaCounts has not been set');
  },
});

function useMediaProvider() {
  const [mediaCounts, setMediaCounts] = useState<MediaCounts>(defaultState.mediaCounts);
  return {
    mediaCounts,
    setMediaCounts,
  };
}

interface Props {
  children: React.ReactNode;
}

export const MediaProvider = ({ children }: Props): React.JSX.Element => {
  const context = useMediaProvider();

  return <MediaContext.Provider value={context}>{children}</MediaContext.Provider>;
};

export const useMediaContext = (): Context => React.useContext(MediaContext);
