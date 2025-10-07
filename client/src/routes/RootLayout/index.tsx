import type { FC } from 'react';
import type React from 'react';

import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useDeviceWidth } from '@/hooks/useDeviceWidth';
import { Toaster } from '@/components/ui/Sonner';
import { Header } from '@/components/Header';

interface TProps {
  children?: React.ReactNode;
}

export const RootLayout: FC<TProps> = observer(function RootLayout({ children }) {
  const { isSm } = useDeviceWidth();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div id="bg" />
      <Header />
      <main className="mb-2 flex grow px-2 sm:px-4 [@media(max-height:620px)]:py-2">
        {children}
        <Outlet />
      </main>
      <Toaster
        expand={!isSm}
        position="top-center"
        visibleToasts={isSm ? 9 : 3}
      />
    </div>
  );
});
