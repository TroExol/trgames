import type { Meta, StoryObj } from '@storybook/react';

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { dialogService } from '@/routes/games/cryptoz/RoomPage/services';
import { setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';

import { DialogProvider } from './index';

const meta: Meta<typeof DialogProvider> = {
  title: 'routes/games/cryptoz/RoomPage/features/DialogProvider',
  component: DialogProvider,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof DialogProvider>;

const DialogPreview = observer(({ collapsed = false }: { collapsed?: boolean }) => {
  useEffect(() => {
    if (collapsed) {
      dialogStore.setCollapsedDialog({
        title: 'Свернутое событие',
        canClose: true,
        onExpand: () => {
          dialogService.openDialog({
            title: 'Важное событие',
            canCollapse: true,
            canClose: true,
            content: (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Разворачиваем модалку после нажатия по свернутому блоку.</p>
                <p>Используйте этот механизм, чтобы не мешать игровому процессу.</p>
              </div>
            ),
          });
        },
      });
    } else {
      dialogService.openDialog({
        title: 'Важное событие',
        canCollapse: true,
        canClose: true,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Например, здесь можно показать награду или содержимое карт.</p>
            <p>Storybook позволяет протестировать внешний вид и взаимодействия.</p>
          </div>
        ),
      });
    }

    return () => {
      dialogStore.clearDialogs();
      dialogStore.setCollapsedDialog(null);
    };
  }, [collapsed]);

  return <DialogProvider />;
});

export const ActiveDialog: Story = {
  render: () => {
    setupRoomPageState();
    return <DialogPreview />;
  },
};

export const CollapsedDialog: Story = {
  render: () => {
    setupRoomPageState();
    return <DialogPreview collapsed />;
  },
};
