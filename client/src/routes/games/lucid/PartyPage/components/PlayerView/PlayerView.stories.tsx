import type { Meta, StoryObj } from '@storybook/react';

import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { themeStyle } from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';

import { PlayerView } from './index';

const ECellType = LucidShared.ECellType;
const EShopCard = LucidShared.EShopCard;

const TRACK: LucidShared.TTrack = {
  cells: [
    { id: 0, type: ECellType.START, next: [1] },
    { id: 1, type: ECellType.EVENT, next: [2] },
    { id: 2, type: ECellType.FINISH, next: [] },
  ],
  startId: 0,
  finishId: 2,
};

const PALETTE = ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd'];
const WORLD_NAME = 'Заброшенная станция';
const LONG_ROLE = 'механик ржавых шестерёнок и хранитель забытых чертежей дальнего шлюза';

const setupParty = (hand: LucidShared.THandCard[]): void => {
  const order = ['p1', 'p2'];
  const theme: LucidShared.TTheme = { name: WORLD_NAME, resourceName: 'заряды', palette: PALETTE };

  partyStore.reset();
  partyStore.applyView({
    partyId: 'story-party',
    code: '1234',
    phase: LucidShared.EPartyPhase.PLAYING,
    members: [
      { playerId: 'p1', nickname: 'Ваня', isConnected: false, hasAnswered: true },
      { playerId: 'p2', nickname: 'Аня', isConnected: true, hasAnswered: true },
    ],
    ownerId: 'p1',
    you: 'p2',
    theme,
    usedFallback: false,
    state: {
      G: {
        players: {
          p1: {
            id: 'p1',
            nickname: 'Ваня',
            position: TRACK.finishId,
            resource: 7,
            skipTurns: 2,
            cursed: 1,
            role: LONG_ROLE,
          },
          p2: { id: 'p2', nickname: 'Аня', position: 1, resource: 3, skipTurns: 0 },
        },
        order,
        track: TRACK,
        events: {},
        theme,
        visited: [0],
        branchChoices: [],
        pendingSteps: 0,
        cellHistory: {},
        cardNames: { [EShopCard.CLOVER]: { name: 'Клевер дальнего шлюза', flavor: 'Растёт там, где нет света' } },
        cards: { laws: [null, null, null], lawDraw: [], shopOffer: [], hands: { p1: hand } },
        turn: { step: LucidShared.ETurnStep.START, fired: [], extraTurn: false, used: [] },
      },
      ctx: { currentPlayer: 'p2', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
      stateId: 1,
      you: 'p2',
    },
  });
};

const Frame = observer(() => (
  <div
    className="relative -m-6 h-dvh overflow-hidden font-golos"
    style={themeStyle(deriveRoles(PALETTE), WORLD_NAME)}
  >
    <PlayerView onClose={() => undefined} playerId="p1" />
  </div>
));

const meta = {
  title: 'Games/Lucid/PlayerView',
  component: PlayerView,
  args: { onClose: () => undefined, playerId: 'p1' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PlayerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LongRoleThreeCards: Story = {
  name: 'Длинная роль, три карты, состояния',
  render: () => {
    setupParty([
      { uid: 1, card: EShopCard.CLOVER },
      { uid: 2, card: EShopCard.GRENADE },
      { uid: 3, card: EShopCard.MONEY_MAGNET },
    ]);

    return <Frame />;
  },
};

export const EmptyHand: Story = {
  name: 'Пустая рука',
  render: () => {
    setupParty([]);

    return <Frame />;
  },
};
