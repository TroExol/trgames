import type { Meta, StoryObj } from '@storybook/react';

import { setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { DarknessCrown } from './index';

const meta: Meta<typeof DarknessCrown> = {
  title: 'routes/games/cryptoz/RoomPage/features/DarknessCrown',
  component: DarknessCrown,
  parameters: {
    layout: 'centered',
  },
  render: () => {
    setupRoomPageState({
      room: {
        darknessCrown: {
          name: 'Корона тьмы',
          description: 'Позволяет владельцу усиливать тьму и контролировать ход боя.',
          isPlaying: false,
        },
      },
    });

    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Корона находится у другого участника.</p>
        <DarknessCrown />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<typeof DarknessCrown>;

export const Default: Story = {};
