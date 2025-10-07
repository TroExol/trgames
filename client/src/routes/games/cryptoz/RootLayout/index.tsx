import { useUnmount } from 'usehooks-ts';
import { Outlet } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useGameTheme } from '@/providers/GameThemeProvider';

export const RootLayout = observer(function RootLayout() {
  const { setGameTheme, clearGameTheme } = useGameTheme();

  useLayoutEffect(() => {
    setGameTheme('cryptoz');
  });

  useUnmount(() => {
    clearGameTheme();
  });

  return (
    <Outlet />
  );
});
