import type { Meta, StoryObj } from '@storybook/react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './Popover';
import { Button } from './Button';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Фильтры
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">
            Подбор игры
          </h4>
          <p className="text-sm text-muted-foreground">
            Выберите жанр, количество участников и примерную длительность партии.
          </p>
          <Button size="sm">
            Применить
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
