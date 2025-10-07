/* eslint-disable react-refresh/only-export-components */
import type React from 'react';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';

type GameTheme = 'cryptoz';

type GameThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: GameTheme;
};

type GameThemeProviderState = {
  clearGameTheme: () => void;
  gameTheme: GameTheme | undefined;
  setGameTheme: (theme: GameTheme) => void;
};

const initialState: GameThemeProviderState = {
  clearGameTheme: () => null,
  gameTheme: undefined,
  setGameTheme: () => null,
};

const GameThemeProviderContext = createContext<GameThemeProviderState>(initialState);

export const GameThemeProvider = observer(function GameThemeProvider({
  children,
  defaultTheme,
  ...props
}: GameThemeProviderProps) {
  const [gameTheme, setGameTheme] = useState<GameTheme | undefined>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('cryptoz');
    if (gameTheme) {
      root.classList.add(gameTheme);
    }
  }, [gameTheme]);

  const value = {
    clearGameTheme: () => setGameTheme(undefined),
    gameTheme,
    setGameTheme,
  };

  return (
    <GameThemeProviderContext.Provider {...props} value={value}>
      {children}
    </GameThemeProviderContext.Provider>
  );
});

export const useGameTheme = () => {
  const context = useContext(GameThemeProviderContext);

  if (context === undefined)
    throw new Error('useGameTheme must be used within a GameThemeProvider');

  return context;
};
