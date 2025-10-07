import type { Meta, StoryObj } from '@storybook/react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';
import { Button } from './Button';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="min-h-[60vh] bg-muted/20">
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button>
            Открыть нижнее меню
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Быстрые действия
            </DrawerTitle>
            <DrawerDescription>
              Управляйте параметрами профиля и настройками уведомлений.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4 text-sm text-muted-foreground">
            <p>
              Вы можете включить или отключить уведомления, изменить язык интерфейса и выбрать тему оформления.
            </p>
            <p>
              Эти настройки можно изменить в любое время — просто откройте нижнее меню повторно.
            </p>
          </div>
          <DrawerFooter>
            <Button>
              Сохранить изменения
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">
                Закрыть
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
