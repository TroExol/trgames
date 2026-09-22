import type {
  Decorator,
  Meta,
  StoryObj,
} from '@storybook/react';

import { LucidShared } from '@trgames/shared';

import { themeStyle } from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';

import { Board } from './index';

const ECellType = LucidShared.ECellType;
const EPhase = LucidShared.EPhase;

// Длина ветки развилки в клетках — как на сервере
const FORK_BRANCH_LENGTH = 2;

// Трек собирается тем же способом, что и на сервере: прямые участки, между
// ними развилки из двух веток равной длины. Форма получается настоящая,
// а не удобная для рисунка
const buildTrack = (straights: number[]): LucidShared.TTrack => {
  const cells: LucidShared.TCell[] = [{ id: 0, type: ECellType.START, next: [] }];
  let tails = [0];
  let nextId = 1;

  const addCell = (type: LucidShared.ECellType): number => {
    const id = nextId++;

    cells.push({ id, type, next: [] });

    return id;
  };

  const linkTo = (ids: number[], targetId: number): void => {
    ids.forEach(id => cells[id].next.push(targetId));
  };

  straights.forEach((length, index) => {
    for (let step = 0; step < length; step++) {
      const id = addCell(ECellType.EVENT);

      linkTo(tails, id);
      tails = [id];
    }

    if (index === straights.length - 1) {
      return;
    }

    const forkStart = tails;

    tails = [0, 1].map(() => {
      let previous = forkStart;
      let head = 0;

      for (let step = 0; step < FORK_BRANCH_LENGTH; step++) {
        const id = addCell(ECellType.EVENT);

        linkTo(previous, id);
        previous = [id];
        head = id;
      }

      return head;
    });
  });

  const finishId = addCell(ECellType.FINISH);

  linkTo(tails, finishId);

  return { cells, startId: 0, finishId };
};

interface TPartyParams {
  track: LucidShared.TTrack;
  nicknames: string[];
  world: string;
  resource: string;
  palette: string[];
  // Необязательные: партия из базы, сгенерированная до краёв, их не имеет
  regions?: LucidShared.TRegion[];
}

// Расстановка нарочно неудобная: один игрок на старте, двое на одной клетке,
// ходящий — на развилке с подсвеченными ветками
const makeParty = ({
  track,
  nicknames,
  world,
  resource,
  palette,
  regions,
}: TPartyParams): LucidShared.TStateForPlayer => {
  const forkCell = track.cells.find(cell => cell.next.length > 1) ?? track.cells[0];
  const middleId = track.cells[Math.floor(track.cells.length / 2)].id;
  const spots = [track.startId, middleId, middleId, forkCell.id];
  const players = nicknames.map((nickname, index) => ({
    id: `p${index + 1}`,
    nickname,
    position: spots[index] ?? track.cells[Math.min(index * 3, track.cells.length - 2)].id,
    resource: 3,
    skipTurns: 0,
  }));
  const order = players.map(player => player.id);
  const walker = order[Math.min(3, order.length - 1)];

  return {
    G: {
      players: Object.fromEntries(players.map(player => [player.id, player])),
      order,
      track,
      events: {},
      theme: { name: world, resourceName: resource, palette, regions },
      visited: track.cells.filter(cell => cell.id <= forkCell.id).map(cell => cell.id),
      branchChoices: forkCell.next,
      pendingSteps: 2,
      lastRoll: { playerId: walker, value: 5 },
    },
    ctx: {
      currentPlayer: walker,
      turn: 7,
      numPlayers: players.length,
      phase: EPhase.BRANCH,
    },
    stateId: 12,
    // Смотрим глазами второго игрока: его ник на поле набран жирным
    you: order[1],
  };
};

const STATION_PALETTE = ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd'];
// Края описывают места, а не события: содержимое клетки — секрет до посещения
const STATION_REGIONS = [
  { name: 'Машинный зал', color: '#415a77' },
  { name: 'Оранжерея', color: '#4f7942' },
  { name: 'Соляные пустоши', color: '#c9b79c' },
];
const FOUR = ['Аня', 'Борис', 'Вика', 'Гриша'];
const SIX = [...FOUR, 'Даша', 'Егор'];

// Оформление партии берётся из темы истории: так же, как его возьмёт экран
// партии. Поле рисуется поверх процедурного фона своего мира
const withTheme: Decorator = (Story, context) => {
  const { theme } = (context.args as { state: LucidShared.TStateForPlayer }).state.G;
  const roles = deriveRoles(theme.palette);

  // Отрицательные поля гасят отступ общей обёртки Storybook: тема партии
  // занимает весь экран, как и на самом экране партии. Высота задана точно,
  // а не минимумом: поле тянется по высоте контейнера, а min-height оставляет
  // высоту неопределённой, и поле вернулось бы к своим пропорциям
  return (
    <div
      className="-m-6 flex h-dvh flex-col overflow-hidden p-4 font-golos"
      style={themeStyle(roles, theme.name)}
    >
      <p className="font-unbounded text-lg">{theme.name}</p>
      <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{theme.resourceName}</p>

      {/* Поле занимает собой всё, что осталось от полос: так оно и будет жить */}
      <div className="flex min-h-0 grow">
        <Story />
      </div>
    </div>
  );
};

const meta = {
  title: 'Games/Lucid/Board',
  component: Board,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onSelectCell: { action: 'выбрана ветка' },
  },
  decorators: [withTheme],
} satisfies Meta<typeof Board>;

export default meta;
type Story = StoryObj<typeof meta>;

// Две развилки, четыре игрока: самый частый вид поля
export const Station: Story = {
  args: {
    state: makeParty({
      track: buildTrack([2, 2, 2]),
      nicknames: FOUR,
      world: 'Заброшенная станция',
      resource: 'заряды',
      palette: STATION_PALETTE,
      regions: STATION_REGIONS,
    }),
  },
};

// Полная длина: видно, как змейка ведёт себя на пятидесяти клетках
export const LongTrack: Story = {
  args: {
    state: makeParty({
      track: buildTrack([7, 7, 6, 6, 6]),
      nicknames: SIX,
      world: 'Заброшенная станция',
      resource: 'заряды',
      palette: STATION_PALETTE,
      regions: [
        ...STATION_REGIONS,
        { name: 'Реакторный блок', color: '#f4a259' },
        { name: 'Шлюзовой отсек', color: '#778da9' },
      ],
    }),
  },
};

// Светлая палитра: вывод ролей обязан работать в обе стороны
export const Pirates: Story = {
  args: {
    state: makeParty({
      track: buildTrack([3, 3, 3, 3]),
      nicknames: FOUR,
      world: 'Пираты Карибского моря',
      resource: 'дублоны',
      palette: ['#f6f4ef', '#e8dcc8', '#c0a080', '#1b2a41'],
      regions: [
        { name: 'Пальмовый берег', color: '#c0a080' },
        { name: 'Бухта висельников', color: '#1b2a41' },
        { name: 'Пороховой трюм', color: '#8a5a3a' },
      ],
    }),
  },
};

// Пять почти одинаковых серо-бурых: модель вернёт такое рано или поздно
export const HostilePalette: Story = {
  args: {
    state: makeParty({
      track: buildTrack([3, 3, 3]),
      nicknames: FOUR,
      world: 'Пыльный чердак',
      resource: 'находки',
      palette: ['#7a6f63', '#7b7064', '#796e62', '#7a7165', '#7d7266'],
      regions: [
        { name: 'Стопки газет', color: '#7b7064' },
        { name: 'Сундук с тряпьём', color: '#8a7a6a' },
        { name: 'Слуховое окно', color: '#6d6357' },
      ],
    }),
  },
};

// Телефон: поле читается на 360 пикселях и не уезжает за край
export const Phone: Story = {
  args: {
    state: makeParty({
      track: buildTrack([4, 4, 4]),
      nicknames: FOUR,
      world: 'Заброшенная станция',
      resource: 'заряды',
      palette: STATION_PALETTE,
      regions: STATION_REGIONS,
    }),
  },
  decorators: [Story => (
    <div className="h-[600px] w-[360px] border border-dashed" style={{ borderColor: 'var(--lucid-muted)' }}>
      <Story />
    </div>
  )],
};

// Партия из базы, сгенерированная до краёв: поле обязано рисоваться и без них
export const NoRegions: Story = {
  args: {
    state: makeParty({
      track: buildTrack([3, 3, 3]),
      nicknames: FOUR,
      world: 'Заброшенная станция',
      resource: 'заряды',
      palette: STATION_PALETTE,
    }),
  },
};

// Цвета краёв приходят от модели: тут они совпали с основой и друг с другом.
// Поле обязано читаться — обработка цвета дотягивает края до порогов
export const HostileRegions: Story = {
  args: {
    state: makeParty({
      track: buildTrack([3, 3, 3]),
      nicknames: FOUR,
      world: 'Соляные копи',
      resource: 'кристаллы',
      palette: ['#0d1b2a', '#0e1c2b', '#101e2d', '#122030'],
      regions: [
        { name: 'Затопленный штрек', color: '#0d1b2a' },
        { name: 'Соляной купол', color: '#0d1b2a' },
        { name: 'Вентиляционный ствол', color: '#0e1c2b' },
      ],
    }),
  },
};
