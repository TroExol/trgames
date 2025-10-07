import type { CryptozShared } from '@trgames/shared';
import type { Meta, StoryObj } from '@storybook/react';

import { createMockPlayer, setupRoomPageState } from '@/routes/games/cryptoz/RoomPage/__stories__/helpers';
import { TooltipProvider } from '@/components/ui/Tooltip';

import { Player } from './index';

type TPlayerStoryParameters = {
  playerState?: {
    otherPlayers?: CryptozShared.TPlayer[];
    room?: Partial<CryptozShared.TRoom>;
  };
};

const meta: Meta<typeof Player> = {
  title: 'routes/games/cryptoz/RoomPage/entities/Player',
  component: Player,
  parameters: {
    layout: 'centered',
  },
  render: (args, context) => {
    const parameters = context.parameters as TPlayerStoryParameters;
    const playerState = parameters.playerState ?? {};
    const otherPlayers = playerState.otherPlayers ?? [
      createMockPlayer({ nickname: 'Виктор', isReady: true, hasDarknessCrown: false }),
    ];
    const roomOverrides = playerState.room ?? {};

    setupRoomPageState({
      room: {
        ...roomOverrides,
        players: roomOverrides.players ?? [args, ...otherPlayers],
        playerNickname: roomOverrides.playerNickname ?? args.nickname,
        adminNickname: roomOverrides.adminNickname ?? args.nickname,
        activePlayerNickname: roomOverrides.activePlayerNickname ?? args.nickname,
      },
    });

    return (
      <TooltipProvider>
        <Player {...args} />
      </TooltipProvider>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Player>;

const preGamePlayer = createMockPlayer({
  nickname: 'Аделина',
  hasDarknessCrown: true,
  hasNoctullos: true,
  health: 14,
  gloryShards: 5,
  isReady: true,
});

export const PreGame: Story = {
  args: preGamePlayer,
  parameters: {
    playerState: {
      room: {
        isGameStarted: false,
      },
      otherPlayers: [
        createMockPlayer({ nickname: 'Виктор', isReady: false, hasDarknessCrown: false }),
      ],
    },
  },
};

const opponentPlayer = createMockPlayer({
  nickname: 'Виктор',
  hasDarknessCrown: false,
  hasNoctullos: false,
  isOnline: false,
  health: 9,
  gloryShards: 1,
  seals: [],
  stoneShards: [],
  companion: undefined,
  abilities: [],
  hand: [],
  countHand: 0,
  discard: [],
  countDeck: 12,
  isReady: false,
});

export const OpponentView: Story = {
  args: opponentPlayer,
  parameters: {
    playerState: {
      room: {
        playerNickname: 'Админ',
        adminNickname: 'Админ',
        activePlayerNickname: 'Виктор',
        isGameStarted: true,
      },
      otherPlayers: [
        createMockPlayer({ nickname: 'Админ', hasDarknessCrown: true, isReady: true }),
      ],
    },
  },
};
