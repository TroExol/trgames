import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { DrawerDialog, type TDrawerDialogProps } from './DrawerDialog';
import { Button } from './Button';

const meta = {
  title: 'UI/DrawerDialog',
  component: DrawerDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    isOpen: { table: { disable: true } },
    setIsOpen: { table: { disable: true } },
  },
} satisfies Meta<typeof DrawerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerDialogStory = observer(({
  children,
  content,
  isOpen: initialIsOpen,
  setIsOpen: omittedSetIsOpen,
  ...rest
}: TDrawerDialogProps) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  void omittedSetIsOpen;

  return (
    <div className="min-h-[60vh] bg-muted/20 p-6">
      <DrawerDialog
        {...rest}
        content={content}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      >
        <Button>
          {children}
        </Button>
      </DrawerDialog>
    </div>
  );
});

export const Default: Story = {
  args: {
    isOpen: true,
    setIsOpen: () => {},
    title: 'Панель управления',
    description: 'Управляйте личными данными и настройками аккаунта в одном месте.',
    children: 'Открыть панель',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Здесь можно настроить параметры уведомлений, выбрать тему оформления и обновить контактные данные.
        </p>
        <p>
          Нажмите на кнопку внизу, чтобы закрыть панель после проверки изменений.
        </p>
      </div>
    ),
  },
  render: args => <DrawerDialogStory {...args} />,
};
