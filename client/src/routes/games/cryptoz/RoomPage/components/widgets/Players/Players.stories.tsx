import type { Meta, StoryObj } from '@storybook/react';

import { createMockPlayer, setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Players } from './index';

const meta: Meta<typeof Players> = {
  title: 'routes/games/cryptoz/RoomPage/widgets/Players',
  component: Players,
  parameters: {
    layout: 'centered',
  },
  render: () => {
    const me = createMockPlayer({ nickname: 'Аделина', hasDarknessCrown: true, isReady: true });
    const opponent = createMockPlayer({ nickname: 'Виктор', isReady: false, isOnline: false, hasNoctullos: true });
    const third = createMockPlayer({ nickname: 'Мира', isReady: true, stoneShards: [] });

    setupRoomPageState({
      room: {
        players: [me, opponent, third],
        playerNickname: me.nickname,
        adminNickname: me.nickname,
        activePlayerNickname: opponent.nickname,
        isGameStarted: false,
      },
    });

    return <Players />;
  },
};

export default meta;

type Story = StoryObj<typeof Players>;

export const Default: Story = {};
