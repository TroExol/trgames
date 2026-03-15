import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { RootLayout } from '@/routes/RootLayout';
import { cryptozRoutes } from '@/routes/games/cryptoz';
import { ErrorPage } from '@/routes/ErrorPage';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { GameThemeProvider } from '@/providers/GameThemeProvider';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import { TooltipProvider } from '@/components/ui/Tooltip';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        index: true,
        lazy: () => import('@/routes/GamesPage'),
      },
      cryptozRoutes,
    ],
  },
]);

const App = observer(function App() {
  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <GameThemeProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </GameThemeProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
});

export default App;
