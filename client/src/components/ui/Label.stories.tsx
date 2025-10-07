import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './Label';
import { Input } from './Input';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="nickname">
        Никнейм
      </Label>
      <Input id="nickname" placeholder="Введите никнейм" />
    </div>
  ),
};
