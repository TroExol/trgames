import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  args: {
    children: 'Кнопка',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <span className="flex items-center gap-2">
        <span aria-label="sparkles" role="img">
          ✨
        </span>
        Кнопка
      </span>
    ),
  },
};

export const AsIcon: Story = {
  args: {
    size: 'icon',
    children: (
      <span aria-label="rocket" role="img">
        🚀
      </span>
    ),
  },
};
