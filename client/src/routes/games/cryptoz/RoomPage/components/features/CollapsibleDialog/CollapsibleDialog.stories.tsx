import type { Meta, StoryObj } from '@storybook/react';

import { setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { CollapsibleDialog } from './index';

const meta: Meta<typeof CollapsibleDialog> = {
  title: 'routes/games/cryptoz/RoomPage/features/CollapsibleDialog',
  component: CollapsibleDialog,
  parameters: {
    layout: 'centered',
  },
  render: args => {
    setupRoomPageState();

    return (
      <CollapsibleDialog {...args}>
        <div className="max-w-sm space-y-2 text-sm text-muted-foreground">
          <p>
            Используйте эту модалку, чтобы показывать участникам списки карт, выбор варианта или финальные результаты.
          </p>
          <p>Нажмите на кнопку сворачивания, чтобы увидеть пример свернутого состояния.</p>
        </div>
      </CollapsibleDialog>
    );
  },
};

export default meta;

type Story = StoryObj<typeof CollapsibleDialog>;

export const Default: Story = {
  args: {
    title: 'Модалка примера',
    canClose: true,
    canCollapse: true,
  },
};
