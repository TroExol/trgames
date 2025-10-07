import type { Meta, StoryObj } from '@storybook/react';

import { Toggle } from './Toggle';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Включить',
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Pressed: Story = {
  args: {
    defaultPressed: true,
  },
};
