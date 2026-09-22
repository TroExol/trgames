import { RootLayout } from './RootLayout';

export const lucidRoutes = {
  path: '/game/lucid',
  element: <RootLayout />,
  children: [
    {
      path: '/game/lucid',
      index: true,
      lazy: () => import('@/routes/games/lucid/LobbyPage'),
    },
    {
      path: '/game/lucid/party/:partyId',
      lazy: () => import('@/routes/games/lucid/PartyPage'),
    },
  ],
};
