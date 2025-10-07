import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Введите текст',
    type: 'text',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: 'Значение по умолчанию',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Поле отключено',
  },
};
