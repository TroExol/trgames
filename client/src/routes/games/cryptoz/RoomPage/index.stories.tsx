import type { Meta, StoryObj } from '@storybook/react';

import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';

import {
  createMockCard,
  createMockLogs,
  createMockMessages,
  createMockPlayer,
  createMockStoneShard,
  setupRoomPageState,
} from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Component as CryptozRoomPage } from './index';

const meta: Meta<typeof CryptozRoomPage> = {
  title: 'routes/games/cryptoz/RoomPage/RoomPage',
  component: CryptozRoomPage,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const me = createMockPlayer({
      nickname: 'Аделина',
      hasDarknessCrown: true,
      hand: [
        createMockCard({ uuid: 'hand-1', name: 'Печать ночи', price: 3 }),
        createMockCard({ uuid: 'hand-2', name: 'Отзвук тьмы', price: 2 }),
        createMockCard({ uuid: 'hand-3', name: 'Ритуал бездны', price: 4 }),
      ],
      countHand: 3,
      isReady: true,
    });
    const opponent = createMockPlayer({
      nickname: 'Виктор',
      hasNoctullos: true,
      hasDarknessCrown: false,
      isReady: false,
      isOnline: false,
    });

    setupRoomPageState({
      room: {
        name: 'Финал сезона',
        players: [me, opponent],
        playerNickname: me.nickname,
        adminNickname: me.nickname,
        activePlayerNickname: opponent.nickname,
        countDeck: 26,
        market: [
          createMockCard({ uuid: 'market-1', name: 'Коготь тьмы', price: 4 }),
          createMockCard({ uuid: 'market-2', name: 'Книга теней', price: 5 }),
          createMockCard({ uuid: 'market-3', name: 'Искра бездны', price: 3 }),
        ],
        harbinger: createMockCard({ uuid: 'harbinger', name: 'Предвестник кошмара', price: 7 }),
        countHarbingers: 1,
        darknessMadness: [
          createMockCard({ uuid: 'madness', name: 'Сгусток хаоса', price: 6 }),
        ],
        cursedSeal: [
          createMockCard({ uuid: 'cursed-1', name: 'Печать забвения', price: 0 }),
          createMockCard({ uuid: 'cursed-2', name: 'Печать угасания', price: 0 }),
        ],
        stoneShards: [
          createMockStoneShard({ uuid: 'stone-1' }),
          createMockStoneShard({ uuid: 'stone-2', id: 2 }),
          createMockStoneShard({ uuid: 'stone-3', id: 3 }),
        ],
        removed: {
          cards: [createMockCard({ uuid: 'removed-card', name: 'Пропавший ритуал' })],
          chaos: [createMockCard({ uuid: 'removed-chaos', name: 'Шторм хаоса' })],
        },
      },
      messages: {
        list: createMockMessages(),
        lastReadIndex: 1,
      },
      logs: {
        list: createMockLogs(),
        lastReadIndex: 1,
      },
    });

    return (
      <MemoryRouter initialEntries={['/game/cryptoz/room/demo']}>
        <Routes>
          <Route element={<CryptozRoomPage />} path="/game/cryptoz/room/:roomId" />
        </Routes>
      </MemoryRouter>
    );
  },
};

export default meta;

type Story = StoryObj<typeof CryptozRoomPage>;

export const Default: Story = {};
