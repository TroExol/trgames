import type { Meta, StoryObj } from '@storybook/react';

import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { themeStyle } from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';

import { Hud } from './index';

const ECellType = LucidShared.ECellType;
const EPhase = LucidShared.EPhase;
const EPartyPhase = LucidShared.EPartyPhase;

// HUD не рисует поле — трек нужен только затем, чтобы состояние партии
// осталось валидным (позиция игрока, старт/финиш)
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

interface TPlayerSetup {
  nickname: string;
  role?: string;
}

// HUD читает партию из partyStore напрямую, не пропсами (как и боевой
// SocketService.connect → partyStore.applyView) — история наполняет тот же
// синглтон-стор, а не подменяет компонент
const setupHud = (players: TPlayerSetup[], ribbon: string[], usedFallback = false): void => {
  const withIds = players.map((player, index) => ({ id: `p${index + 1}`, ...player }));
  const order = withIds.map(player => player.id);
  const theme: LucidShared.TTheme = { name: WORLD_NAME, resourceName: 'заряды', palette: PALETTE };

  partyStore.reset();
  partyStore.applyView({
    partyId: 'story-party',
    phase: EPartyPhase.PLAYING,
    members: withIds.map(player => ({
      playerId: player.id,
      nickname: player.nickname,
      isConnected: true,
      hasAnswered: true,
    })),
    ownerId: order[0],
    you: order[0],
    theme,
    usedFallback,
    state: {
      G: {
        players: Object.fromEntries(withIds.map(player => [player.id, {
          id: player.id,
          nickname: player.nickname,
          position: TRACK.cells[1].id,
          resource: 3,
          skipTurns: 0,
          role: player.role,
        }])),
        order,
        track: TRACK,
        events: {},
        theme,
        visited: [0],
        branchChoices: [],
        pendingSteps: 0,
        lastRoll: undefined,
        cellHistory: {},
      },
      ctx: {
        currentPlayer: order[0],
        turn: 1,
        numPlayers: order.length,
        phase: EPhase.ROLL,
      },
      stateId: 1,
      you: order[0],
    },
  });
  partyStore.appendRibbon(ribbon);
};

// Обёртка повторяет разметку сцены партии (PartyPage/index.tsx): relative-блок
// на весь экран, HUD лежит над ним двумя полосами сверху и снизу.
// -m-6 гасит отступ общей обёртки Storybook (`p-6`) — тот же приём, что и в
// withTheme из Board.stories.tsx
const HudFrame = observer(() => {
  const roles = deriveRoles(PALETTE);

  return (
    <div className="relative -m-6 h-dvh overflow-hidden font-golos" style={themeStyle(roles, WORLD_NAME)}>
      <Hud />
    </div>
  );
});

const meta = {
  title: 'Games/Lucid/Hud',
  component: Hud,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Hud>;

export default meta;
type Story = StoryObj<typeof meta>;

// Двое игроков: свободного места в строке много, роль должна быть видна
// почти целиком
export const TwoPlayersLongRoles: Story = {
  name: 'Двое, длинные роли',
  render: () => {
    setupHud([
      { nickname: 'Ваня', role: 'механик ржавых шестерёнок' },
      { nickname: 'Аня', role: 'хранитель забытых чертежей' },
    ], ['Ваня бросил кубик и получил 5.']);

    return <HudFrame />;
  },
};

// Шесть игроков: свободного места на каждого меньше, роль режется сильнее —
// но строка не должна стать выше, чем с прежним фиксированным max-w-24
export const SixPlayersLongRoles: Story = {
  name: 'Шестеро, длинные роли',
  render: () => {
    setupHud([
      { nickname: 'Ваня', role: 'механик ржавых шестерёнок' },
      { nickname: 'Аня', role: 'хранитель забытых чертежей' },
      { nickname: 'Борис', role: 'смотритель дальнего маяка' },
      { nickname: 'Вика', role: 'проводник по гулким тоннелям' },
      { nickname: 'Гриша', role: 'сборщик потерянных сигналов' },
      { nickname: 'Даша', role: 'хранительница тихих архивов' },
    ], ['Ход переходит по кругу.']);

    return <HudFrame />;
  },
};

// Запасная партия (4.7): модель не прислала роли вовсе — строка игроков
// держит вёрстку и без единой роли, без падения
export const NoRoles: Story = {
  name: 'Без ролей',
  render: () => {
    setupHud([
      { nickname: 'Ваня' },
      { nickname: 'Аня' },
      { nickname: 'Борис' },
      { nickname: 'Вика' },
    ], ['Придумать ваш мир не получилось, играем на запасном.'], true);

    return <HudFrame />;
  },
};
