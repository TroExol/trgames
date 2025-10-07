import type { Meta, StoryObj } from '@storybook/react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './Tooltip';
import { Button } from './Button';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">
            Навести курсор
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Подсказка с дополнительной информацией
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
