import type { Meta, StoryObj } from '@storybook/react';

import { ScrollArea } from './ScrollArea';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = [
  'Играйте в любимые настольные игры онлайн с друзьями.',
  'Создайте приватную комнату и пригласите участников по ссылке.',
  'Выбирайте различные режимы сложности, чтобы сделать игру интереснее.',
  'Следите за прогрессом команды и отмечайте достижения.',
  'Получайте уведомления о ходе партии и новых приглашениях.',
  'Сохраняйте ваши настройки и предпочтения в профиле.',
  'Возвращайтесь к завершённым сессиям, чтобы проанализировать стратегию.',
];

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-80 rounded-md border p-4">
      <div className="space-y-3 text-sm text-muted-foreground">
        {paragraphs.map(paragraph => (
          <p key={paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
