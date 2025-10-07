import type { Meta, StoryObj } from '@storybook/react';

import { List } from './List';

const meta = {
  title: 'UI/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <li>Выберите игру для новой сессии.</li>
        <li>Пригласите друзей через ссылку.</li>
        <li>Настройте уровень сложности перед стартом.</li>
      </>
    ),
  },
  render: args => (
    <List {...args} />
  ),
};
