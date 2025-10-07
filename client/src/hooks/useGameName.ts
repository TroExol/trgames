import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export const useGameName = (): { gameName?: string } => {
  const location = useLocation();
  const gameName = useMemo(() => /^\/game\/([^/]+)/.exec(location.pathname)?.[1], [location]);
  return { gameName };
};
