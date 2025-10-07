import type { CryptozShared } from '@trgames/shared';
import type { Meta, StoryObj } from '@storybook/react';

import { Ability } from './index';

const baseAbility: CryptozShared.TAbility = {
  uuid: 'ability-1',
  id: 1,
  description: 'Оживляет древний ритуал и усиливает следующую атаку союзника.',
  canPlayHandler: true,
  isPlaying: false,
  isPlayed: false,
  ownerNickname: 'Элара',
};

const meta = {
  title: 'Games/Cryptoz/RoomPage/Ability',
  component: Ability,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
} satisfies Meta<typeof Ability>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...baseAbility,
  },
};

export const Small: Story = {
  args: {
    ...baseAbility,
    variant: 'sm',
  },
};

export const LargePlaying: Story = {
  args: {
    ...baseAbility,
    variant: 'lg',
    isPlaying: true,
  },
};

export const Disabled: Story = {
  args: {
    ...baseAbility,
    isDisabled: true,
  },
};

export const Shirt: Story = {
  args: {
    isShowShirt: true,
    variant: 'md',
  },
};
