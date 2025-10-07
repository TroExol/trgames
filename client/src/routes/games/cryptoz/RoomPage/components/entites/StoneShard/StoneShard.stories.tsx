import type { CryptozShared } from '@trgames/shared';
import type { Meta, StoryObj } from '@storybook/react';

import { StoneShard } from './index';

const baseStoneShard: CryptozShared.TStoneShard = {
  uuid: 'stone-shard-1',
  id: 1,
  description: 'Сияющий осколок, усиливающий магию владельца и поглощающий тьму.',
  ownerNickname: 'Сарин',
};

const meta = {
  title: 'Games/Cryptoz/RoomPage/StoneShard',
  component: StoneShard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
} satisfies Meta<typeof StoneShard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...baseStoneShard,
  },
};

export const Small: Story = {
  args: {
    ...baseStoneShard,
    variant: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...baseStoneShard,
    variant: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    ...baseStoneShard,
    isDisabled: true,
  },
};

export const Shirt: Story = {
  args: {
    isShowShirt: true,
    variant: 'md',
  },
};
