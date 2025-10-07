/* eslint-disable react-refresh/only-export-components */
import type React from 'react';

import { useTernaryDarkMode } from 'usehooks-ts';
import {
  createContext,
  useContext,
  useEffect,
} from 'react';
import { observer } from 'mobx-react-lite';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultValue?: boolean;
};

type ThemeProviderState = {
  isDarkMode: boolean;
  toggle: () => void;
};

const initialState: ThemeProviderState = {
  isDarkMode: false,
  toggle: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export const ThemeProvider = observer(function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const { isDarkMode, setTernaryDarkMode } = useTernaryDarkMode({ defaultValue: 'system' });

  const toggle = () => {
    setTernaryDarkMode(isDarkMode ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    toggle,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
});

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
