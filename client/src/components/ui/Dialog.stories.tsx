import type { Meta, StoryObj } from '@storybook/react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
import { Button } from './Button';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>
          Открыть модальное окно
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Настройки профиля
          </DialogTitle>
          <DialogDescription>
            Обновите данные профиля. Все изменения сохранятся автоматически после закрытия окна.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-left text-sm text-muted-foreground">
          <p>
            Вы можете изменить имя пользователя, фотографию и контактную информацию.
          </p>
          <p>
            Настройки уведомлений доступны на отдельной вкладке.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">
              Готово
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
