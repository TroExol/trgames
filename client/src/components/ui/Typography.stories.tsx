import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './Typography';

const meta = {
  title: 'UI/Typography',
  component: Typography,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'p',
    children: 'Пример текста',
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Showcase: Story = {
  render: () => (
    <div className="space-y-4 text-left">
      <Typography variant="h1">
        Крупный заголовок
      </Typography>
      <Typography variant="h2">
        Раздел с описанием
      </Typography>
      <Typography variant="h3">
        Подзаголовок раздела
      </Typography>
      <Typography variant="h4">
        Малый подзаголовок
      </Typography>
      <Typography variant="lead">
        Платформа для совместных настольных игр в онлайн формате.
      </Typography>
      <Typography variant="p">
        Добавляйте игры в коллекцию, приглашайте друзей и отслеживайте прогресс каждой партии.
      </Typography>
      <Typography variant="blockquote">
        «Игры — лучший способ провести время вместе, даже когда вы в разных городах»
      </Typography>
      <Typography variant="inline-code">
        yarn workspace @trgames/client storybook
      </Typography>
      <Typography variant="large">
        Преимущества:
      </Typography>
      <Typography variant="small">
        Работает на любых устройствах.
      </Typography>
      <Typography variant="muted">
        Режим в разработке: поддержка пользовательских модов.
      </Typography>
    </div>
  ),
};
