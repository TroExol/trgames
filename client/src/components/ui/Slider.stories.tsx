import type { Meta, StoryObj } from '@storybook/react';

import { Slider } from './Slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    defaultValue: [60],
    max: 100,
    step: 10,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: {
    defaultValue: [30, 70],
  },
};
