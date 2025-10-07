import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { DrawerPopover, type TDrawerPopoverProps } from './DrawerPopover';
import { Button } from './Button';

const meta = {
  title: 'UI/DrawerPopover',
  component: DrawerPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    isOpen: { table: { disable: true } },
    setIsOpen: { table: { disable: true } },
  },
} satisfies Meta<typeof DrawerPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerPopoverStory = observer(({
  children,
  content,
  isOpen: initialIsOpen,
  setIsOpen: omittedSetIsOpen,
  ...rest
}: TDrawerPopoverProps) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  void omittedSetIsOpen;

  return (
    <div className="min-h-[60vh] bg-muted/20 p-6">
      <DrawerPopover
        {...rest}
        content={content}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      >
        <Button>
          {children}
        </Button>
      </DrawerPopover>
    </div>
  );
});

export const Default: Story = {
  args: {
    isOpen: true,
    setIsOpen: () => {},
    title: 'Быстрые настройки',
    description: 'Интерактивная панель с адаптацией под размер экрана.',
    children: 'Открыть панель',
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Выберите один из доступных вариантов, чтобы адаптировать интерфейс под ваши задачи.
        </p>
        <p>
          На мобильных устройствах панель откроется в виде нижнего меню.
        </p>
      </div>
    ),
  },
  render: args => <DrawerPopoverStory {...args} />,
};
