import type { Meta, StoryObj } from '@storybook/react';

import { toast } from 'sonner';
import { type ComponentProps, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { observer } from 'mobx-react-lite';

import { Toaster } from './Sonner';
import { Button } from './Button';

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const SonnerStory = observer((props: ComponentProps<typeof Toaster>) => {
  useEffect(() => {
    toast.success('Настройки успешно сохранены');
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="space-y-4">
        <Button onClick={() => toast('Это пример уведомления')}>
          Показать уведомление
        </Button>
        <Toaster {...props} />
      </div>
    </NextThemesProvider>
  );
});

export const Default: Story = {
  args: {},
  render: args => <SonnerStory {...args} />,
};
