import { RootLayout } from './RootLayout';

export const cryptozRoutes = {
  path: '/game/cryptoz',
  element: <RootLayout />,
  children: [
    {
      path: '/game/cryptoz',
      index: true,
      lazy: () => import('@/routes/games/cryptoz/RoomsPage'),
    },
    {
      path: '/game/cryptoz/room/:roomUuid',
      lazy: () => import('@/routes/games/cryptoz/RoomPage'),
    },
    {
      path: '/game/cryptoz/rules',
      lazy: () => import('@/routes/games/cryptoz/RulesPage'),
    },
    {
      path: '/game/cryptoz/updates',
      lazy: () => import('@/routes/games/cryptoz/UpdatesPage'),
    },
  ],
};
