import type { Meta, StoryObj } from '@storybook/react';

import { createMockMessages, setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { Chat } from './index';

const meta: Meta<typeof Chat> = {
  title: 'routes/games/cryptoz/RoomPage/widgets/Chat',
  component: Chat,
  parameters: {
    layout: 'centered',
  },
  render: () => {
    const messages = createMockMessages();

    setupRoomPageState({
      messages: {
        list: messages,
        lastReadIndex: 1,
      },
    });

    return <Chat />;
  },
};

export default meta;

type Story = StoryObj<typeof Chat>;

export const Default: Story = {};
