import type { Meta, StoryObj } from '@storybook/react';

import {
  createMockCard,
  createMockPlayer,
  setupRoomPageState,
} from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Hand } from './index';

const meta: Meta<typeof Hand> = {
  title: 'routes/games/cryptoz/RoomPage/widgets/Hand',
  component: Hand,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const handCards = Array.from({ length: 6 }).map((_, index) =>
      createMockCard({ uuid: `hand-card-${index + 1}`, name: `Карта ${index + 1}`, price: index + 1 }),
    );
    const me = createMockPlayer({
      nickname: 'Аделина',
      hand: handCards,
      countHand: handCards.length,
      isReady: true,
    });

    setupRoomPageState({
      room: {
        players: [me],
        playerNickname: me.nickname,
        activePlayerNickname: me.nickname,
      },
    });

    return (
      <div className="relative h-[420px] w-full bg-muted/30">
        <Hand />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Hand>;

export const Default: Story = {};
