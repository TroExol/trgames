import type { Meta, StoryObj } from '@storybook/react';

import {
  createMockCard,
  createMockPlayer,
  setupRoomPageState,
} from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { PlayCardZone } from './index';

const meta: Meta<typeof PlayCardZone> = {
  title: 'routes/games/cryptoz/RoomPage/features/PlayCardZone',
  component: PlayCardZone,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const draggedCard = createMockCard({
      uuid: 'dragged-card',
      name: 'Темный рывок',
      description: { general: 'Перетащите карту, чтобы сыграть её.' },
    });

    const activePlayer = createMockPlayer({
      nickname: 'Аделина',
      hand: [draggedCard],
      countHand: 1,
      isReady: true,
    });

    setupRoomPageState({
      draggedHandCard: draggedCard,
      room: {
        players: [activePlayer],
        playerNickname: activePlayer.nickname,
        activePlayerNickname: activePlayer.nickname,
      },
    });

    return (
      <div className="relative flex min-h-[500px] items-center justify-center bg-muted/40">
        <PlayCardZone />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<typeof PlayCardZone>;

export const Default: Story = {};
