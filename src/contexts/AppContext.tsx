'use client';

import React, { useState } from 'react';

interface State {
  isTransitionStartOpen: boolean;
}

interface Context extends State {
  setIsTransitionStartOpen: (open: boolean) => void;
}

const defaultState: State = {
  isTransitionStartOpen: false,
};

const AppContext = React.createContext<Context>({
  ...defaultState,
  setIsTransitionStartOpen: () => {
    throw new Error('AppContext.setIsTransitionStartOpen has not been set');
  },
});

function useAppProvider() {
  const [isLoaded, setIsLoaded] = useState(defaultState.isTransitionStartOpen);
  return {
    isTransitionStartOpen: isLoaded,
    setIsTransitionStartOpen: setIsLoaded,
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
