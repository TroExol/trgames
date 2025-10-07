import type { Meta, StoryObj } from '@storybook/react';

import { createMockLogs, setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Logs } from './index';

const meta: Meta<typeof Logs> = {
  title: 'routes/games/cryptoz/RoomPage/widgets/Logs',
  component: Logs,
  parameters: {
    layout: 'centered',
  },
  render: () => {
    const logs = createMockLogs();

    setupRoomPageState({
      logs: {
        list: logs,
        lastReadIndex: 1,
      },
    });

    return <Logs />;
  },
};

export default meta;

type Story = StoryObj<typeof Logs>;

export const Default: Story = {};
