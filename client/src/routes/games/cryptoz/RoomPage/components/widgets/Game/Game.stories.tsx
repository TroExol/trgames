import type { Meta, StoryObj } from '@storybook/react';

import { CryptozShared } from '@trgames/shared';

import {
  createMockCard,
  createMockPlayer,
  setupRoomPageState,
} from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Game } from './index';

const meta: Meta<typeof Game> = {
  title: 'routes/games/cryptoz/RoomPage/widgets/Game',
  component: Game,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const arenaCards = [
      createMockCard({ uuid: 'arena-card-1', name: 'Призрачный выпад', price: 4 }),
      createMockCard({ uuid: 'arena-card-2', name: 'Зов бездны', price: 5 }),
    ];
    const companionCard = createMockCard({
      uuid: 'companion-card',
      name: 'Вестник тьмы',
      type: CryptozShared.ECardType.COMPANION,
      price: 6,
    });
    const activePlayer = createMockPlayer({
      nickname: 'Аделина',
      arena: arenaCards,
      companion: companionCard,
      essenceToSpend: 7,
    });
    const opponent = createMockPlayer({ nickname: 'Виктор', isReady: true });

    setupRoomPageState({
      room: {
        players: [activePlayer, opponent],
        playerNickname: activePlayer.nickname,
        activePlayerNickname: activePlayer.nickname,
        market: [
          createMockCard({ uuid: 'market-card-1', name: 'Осквернённый артефакт', price: 4 }),
          createMockCard({ uuid: 'market-card-2', name: 'Пульс тьмы', price: 6 }),
          createMockCard({ uuid: 'market-card-3', name: 'Клинок бездны', price: 7 }),
        ],
        harbinger: createMockCard({ uuid: 'harbinger-card', name: 'Предвестник хаоса', price: 8 }),
        countHarbingers: 2,
        darknessMadness: [
          createMockCard({
            uuid: 'madness-card',
            name: 'Шёпот пустоты',
            price: 5,
            type: CryptozShared.ECardType.DARKNESS_MADNESS,
          }),
        ],
        pendingAckNicknames: ['Виктор'],
      },
    });

    return (
      <div className="flex min-h-[520px] flex-col bg-muted/30 p-6">
        <Game />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Game>;

export const Default: Story = {};
