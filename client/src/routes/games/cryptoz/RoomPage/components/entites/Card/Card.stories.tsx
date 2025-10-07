import type { Meta, StoryObj } from '@storybook/react';

import { CryptozShared } from '@trgames/shared';

import { Card } from './index';

const baseCard: CryptozShared.TCard = {
  uuid: 'card-1',
  id: CryptozShared.ECardId.ARCHITECT_OF_ILLUSORY_NETS,
  readableId: 'A-01',
  name: 'Архитектор иллюзорных сетей',
  description: {
    general: 'Призовите эфемерную конструкцию, которая защищает союзника от следующей атаки.',
    strike: 'Наносит 2 урона выбранной цели.',
    evade: 'Цель игнорирует первый удар в этом раунде.',
  },
  simpleDescription: {
    general: 'Призыв защитной конструкции и нанесение 2 урона.',
    strike: '2 урона цели.',
  },
  target: CryptozShared.ECardTarget.ENEMY,
  type: CryptozShared.ECardType.CREATURE,
  basePrice: 3,
  baseEssence: 1,
  baseGloryShards: 1,
  price: 3,
  essence: 1,
  gloryShards: 1,
  isSeal: false,
  isPlayingGeneral: false,
  isPlayingStrike: false,
  isPlayingEvade: false,
  isPlayingTotalStrike: false,
  isPlayingSeal: false,
  ownerNickname: 'Элара',
};

const meta = {
  title: 'Games/Cryptoz/RoomPage/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...baseCard,
  },
};

export const Small: Story = {
  args: {
    ...baseCard,
    variant: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...baseCard,
    variant: 'lg',
  },
};

export const Discounted: Story = {
  args: {
    ...baseCard,
    price: 1,
    gloryShards: 3,
  },
};

export const Playing: Story = {
  args: {
    ...baseCard,
    isPlayingGeneral: true,
  },
};

export const DetailedDescription: Story = {
  args: {
    ...baseCard,
    isShowSimpleDescription: false,
  },
};

export const Disabled: Story = {
  args: {
    ...baseCard,
    isDisabled: true,
  },
};

export const Shirt: Story = {
  args: {
    isShowShirt: true,
    variant: 'md',
  },
};
