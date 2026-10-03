# lucid v2, итерации 2 «Законы» и 3 «Лавка» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать ходу решения: общие законы в трёх ячейках меняют правила поля, Лавка продаёт карты в руку, карты руки играются после клетки.

**Architecture:** Ход становится явной машиной шагов `START → LANDED → CARDS → END` (`G.turn.step`). Любая пауза на ввод игрока (событие, выбор закона, Лавка, фаза карт) после ответа зовёт `proceed`, и ход продолжается с того же шага. Законы и пассивные карты срабатывают по таблице эффектов, каждый не больше раза за ход (`G.turn.fired`, `G.turn.used`). Колоды лежат в `G.cards` и не уходят клиенту.

**Tech Stack:** TypeScript, Node + Socket.io (server), React 18 + MobX + Tailwind (client), Vitest, zod.

**Spec:** решения владельца 2026-10-03 (допрос в сессии; записываются в `docs/lucid/OPEN-QUESTIONS.md` задачей 7), раздел «Вторая версия: механики «Большой бродилки»» там же. Устройство игры — `docs/lucid/PRD.md`.

## Global Constraints

- Перед работой прочитать `docs/lucid/PRD.md` (разделы «Словарь», 3, 5.4, 5.5, 6.3) и корневой `CLAUDE.md`.
- Коммиты на русском, без `Co-Authored-By`. Комментарии в код не добавлять (предпочтение владельца).
- Одинарные кавычки, точки с запятой, 2 пробела, ≤120 символов; 2+ именованных импорта — каждый на своей строке; type-импорты первыми.
- Типы из shared — только через неймспейс: `import { LucidShared } from '@trgames/shared'`.
- Один тест-файл: `yarn workspace @trgames/server test --run <путь от server/>`, `yarn workspace @trgames/client test --run <путь от client/>`. Флаг `--run` обязателен.
- Pre-commit хук гоняет `yarn lint` по всем воркспейсам. Красный линт или тест — коммита нет.
- Меняешь поведение lucid — правь `docs/lucid/PRD.md` в том же коммите.
- **Право:** ни одного текста, названия или картинки из оригинальной настолки. Названия и правила карт — только из этого плана. Слова «Тадам», «Хорошо/Плохо», «Лавка Джо» в код и интерфейс не попадают.
- Числа: клетки — события 35%, зелёные 12%, красные 12%, `LAW` 10%, `SHOP` 10% (часть 2), остальное пустые; зелёная и красная клетка сами ничего не дают; ячеек законов 3; рука ≤3; карта Лавки 5 Ресурса; применение активной карты 3 Ресурса; в Лавке 3 карты на выбор, купить можно одну.
- Термины: «Закон», «ячейки законов», «колода законов», «Лавка», «рука», «карта руки», «беда». Не писать «Тадам», «выложенная карта».

## Review Focus

1. Партия из базы, сохранённая до этой итерации (`G` без `cards` и `turn`), должна доигрываться: `upgradeG` заполняет поля по умолчанию (тест в задаче 1).
2. Цепочка законов: «Тропа» привела на другую зелёную — «Тропа» не срабатывает второй раз, ход не зацикливается (тест в задаче 5).
3. Закон требует беду, а в партии нет ни одной беды — ход идёт дальше, партия не встаёт (тест в задаче 4).
4. Игрок отвалился в фазе `LAW`, `SHOP` или `CARDS` — автопилот делает ход, автоигра доходит до победы на 2–6 игроках (тесты в задачах 3, 8, 9).
5. Порядок колод — секрет: `lawDeck` и `shopDeck` не попадают в вид игрока (тесты в задачах 1 и 8).

---

# Часть 1. Законы

### Task 1: Типы законов и хода

**Files:**
- Create: `tools/shared/src/games/lucid/types/cards.ts`
- Create: `tools/shared/src/games/lucid/cardText.ts`
- Modify: `tools/shared/src/games/lucid/types/state.ts`, `types/track.ts`, `types/move.ts`, `types/view.ts`, `index.ts`
- Create: `server/src/games/lucid/core/cards.ts`, `server/src/games/lucid/core/turn.ts`, `server/src/games/lucid/core/upgrade.ts`
- Modify: `server/src/games/lucid/core/setup.ts`, `core/formatForPlayer.ts`, `room/Party.ts:317-320`, `vitest/factories.ts`
- Modify: `client/src/routes/games/lucid/PartyPage/components/Board/Board.stories.tsx`, `Hud/Hud.stories.tsx` (объекты состояния)
- Test: `server/src/games/lucid/core/upgrade.test.ts`, `core/setup.test.ts` (создать, если нет), `core/formatForPlayer.test.ts`

**Interfaces:**
- Produces: `LucidShared.ELaw`, `LucidShared.TCards`, `LucidShared.ETurnStep`, `LucidShared.TTurn`, `LucidShared.LAW_TEXT`, `LucidShared.TCardText`, `LucidShared.TCardsView`, `LucidShared.TTurnView`; `ECellType.LAW`, `EPhase.LAW`, `EMoveType.CHOOSE_LAW`; на сервере `emptyCards()`, `createCards(random)`, `LAW_DECK`, `LAW_SLOTS`, `freshTurn()`, `upgradeG(G)`.

- [ ] **Step 1: Типы shared**

`tools/shared/src/games/lucid/types/cards.ts`:

```ts
import type { TEvent } from './content';

export enum ELaw {
  DOUBLE_AGAIN = 'DOUBLE_AGAIN',
  GREEN_ADVANCE = 'GREEN_ADVANCE',
  GREEN_AGAIN = 'GREEN_AGAIN',
  GREEN_GOOD = 'GREEN_GOOD',
  GREEN_RESOURCE = 'GREEN_RESOURCE',
  LAST_END_ADVANCE = 'LAST_END_ADVANCE',
  LAST_END_DIE = 'LAST_END_DIE',
  LAST_START_FREE_CARD = 'LAST_START_FREE_CARD',
  LAST_START_GOOD = 'LAST_START_GOOD',
  LAST_START_RESOURCE = 'LAST_START_RESOURCE',
  OVERTAKE_STEAL = 'OVERTAKE_STEAL',
  RED_BAD = 'RED_BAD',
  RED_CHOICE = 'RED_CHOICE',
  RED_PAY_ALL = 'RED_PAY_ALL',
  SIX_SKIP = 'SIX_SKIP',
}

export interface TCards {
  laws: (ELaw | null)[];
  lawDeck: ELaw[];
  lawDiscard: ELaw[];
  lawDraw: ELaw[];
}

export enum ETurnStep {
  CARDS = 'CARDS',
  END = 'END',
  LANDED = 'LANDED',
  START = 'START',
}

export interface TTurn {
  step: ETurnStep;
  landedCellId?: number;
  from?: number;
  fired: ELaw[];
  extraTurn: boolean;
  eventCellId?: number;
  lawEvent?: TEvent;
}
```

Смысл полей `TTurn`: `landedCellId` — клетка, где закончилось движение своим ходом (законы цвета смотрят на неё, а не на позицию: сдвиг эффектом события клетку не активирует); `from` — позиция до броска (для обгона); `fired` — законы, сработавшие в этот ход; `extraTurn` — следующий ход снова у этого игрока; `eventCellId` — клетка события, вытянутого законом; `lawEvent` — выбор, который предлагает закон «Пошлина».

`types/state.ts`: импортировать `TCards`, `TTurn` из `./cards`; в `TG` добавить поля `cards: TCards;` и `turn: TTurn;`; в `EPhase` добавить `LAW = 'LAW'`.

`types/track.ts`: в `ECellType` добавить `LAW = 'LAW'`.

`types/move.ts`: в `EMoveType` добавить `CHOOSE_LAW = 'CHOOSE_LAW'`; в `TMove` добавить вариант
`| { type: EMoveType.CHOOSE_LAW; playerId: TPlayerId; stateId: number; index: number }`.

`types/view.ts`:

```ts
export type TCardsView = Pick<TCards, 'laws' | 'lawDraw'>;

export type TTurnView = Omit<TTurn, 'lawEvent'> & { lawEvent?: TEventView };

export interface TStateForPlayer {
  G: { events: Record<number, TEventView>; cards: TCardsView; turn: TTurnView }
    & Omit<TG, 'log' | 'random' | 'events' | 'cards' | 'turn'>;
  ctx: TCtx;
  stateId: number;
  you: TPlayerId;
}
```

(импорты `TCards`, `TTurn` — из `./cards`).

- [ ] **Step 2: Тексты законов**

`tools/shared/src/games/lucid/cardText.ts`. Тексты — наши, не из оригинала:

```ts
import { ELaw } from './types/cards';

export interface TCardText {
  name: string;
  rule: (resourceName: string) => string;
}

export const LAW_TEXT: Record<ELaw, TCardText> = {
  [ELaw.DOUBLE_AGAIN]: { name: 'Дубль', rule: () => 'Выпали два одинаковых кубика — ходи ещё раз' },
  [ELaw.GREEN_ADVANCE]: { name: 'Тропа', rule: () => 'Остановился на зелёной — пройди 7 клеток вперёд, клетка сработает' },
  [ELaw.GREEN_AGAIN]: { name: 'Второе дыхание', rule: () => 'Остановился на зелёной — ходи ещё раз' },
  [ELaw.GREEN_GOOD]: { name: 'Добрый знак', rule: () => 'Остановился на зелёной — разыграй случайное событие без беды' },
  [ELaw.GREEN_RESOURCE]: { name: 'Урожай', rule: resource => `Остановился на зелёной: ${resource} +5` },
  [ELaw.LAST_END_ADVANCE]: {
    name: 'Попутный ветер',
    rule: () => 'Отстающий в конце своего хода проходит 5 клеток вперёд, клетка сработает',
  },
  [ELaw.LAST_END_DIE]: {
    name: 'Лотерея',
    rule: resource => `Отстающий в конце своего хода бросает кубик и получает столько: ${resource}`,
  },
  [ELaw.LAST_START_FREE_CARD]: {
    name: 'Подарок',
    rule: () => 'Отстающий в начале своего хода берёт карту Лавки бесплатно, если в руке меньше трёх',
  },
  [ELaw.LAST_START_GOOD]: {
    name: 'Удача отстающего',
    rule: () => 'Отстающий в начале своего хода разыгрывает случайное событие без беды',
  },
  [ELaw.LAST_START_RESOURCE]: { name: 'Пособие', rule: resource => `Отстающий в начале своего хода: ${resource} +3` },
  [ELaw.OVERTAKE_STEAL]: { name: 'Подножка', rule: resource => `Обогнал игрока броском — забери у него: ${resource} 3` },
  [ELaw.RED_BAD]: { name: 'Дурная примета', rule: () => 'Остановился на красной — разыграй случайную беду' },
  [ELaw.RED_CHOICE]: {
    name: 'Пошлина',
    rule: resource => `Остановился на красной — отдай ${resource} 3 или отступи на 3 клетки`,
  },
  [ELaw.RED_PAY_ALL]: {
    name: 'Налог',
    rule: resource => `Остановился на красной — отдай каждому: ${resource} 2 (вдвоём — 4)`,
  },
  [ELaw.SIX_SKIP]: { name: 'Шестёрка', rule: () => 'Выпала 6 на кубике хода — пропусти следующий ход' },
};
```

`tools/shared/src/games/lucid/index.ts`: добавить `export * from './cardText';` и `export * from './types/cards';`.

- [ ] **Step 3: Написать падающие тесты сервера**

`server/src/games/lucid/core/upgrade.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { upgradeG } from '@/games/lucid/core/upgrade';

describe('upgradeG', () => {
  it('партия до законов получает пустые ячейки и свежий ход', () => {
    const { cards, turn, ...old } = makeG();
    const upgraded = upgradeG(old as LucidShared.TG);

    expect(upgraded.cards.laws).toEqual([null, null, null]);
    expect(upgraded.cards.lawDeck).toEqual([]);
    expect(upgraded.turn).toEqual({ step: LucidShared.ETurnStep.START, fired: [], extraTurn: false });
  });

  it('новая партия не меняется', () => {
    const G = makeG();

    expect(upgradeG(G)).toEqual(G);
  });
});
```

В `core/setup.test.ts` (создать, если файла нет; иначе дописать `describe`):

```ts
it('колода законов перемешана, без «Подарка», ячейки пусты', () => {
  const state = setupParty({
    seed: 'laws',
    players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
    content: { theme: { name: 'Т', resourceName: 'монеты', palette: ['#111111', '#222222', '#333333'] }, events: {} },
  });

  expect(state.G.cards.laws).toEqual([null, null, null]);
  expect([...state.G.cards.lawDeck].sort()).toEqual([...LAW_DECK].sort());
  expect(state.G.cards.lawDeck).not.toContain(LucidShared.ELaw.LAST_START_FREE_CARD);
  expect(state.G.turn.step).toBe(LucidShared.ETurnStep.START);
});
```

В `core/formatForPlayer.test.ts` (создать, если нет):

```ts
it('колода законов не уходит игроку', () => {
  const state = makeFallbackParty({ seed: 'secret' });
  const view = formatForPlayer(state, 'p0');

  expect(view.G.cards).toEqual({ laws: [null, null, null], lawDraw: [] });
  expect(JSON.stringify(view)).not.toContain('lawDeck');
  expect(JSON.stringify(view)).not.toContain('lawDiscard');
});
```

- [ ] **Step 4: Запустить тесты — падают**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/upgrade.test.ts`
Expected: FAIL — модуля `upgrade` нет.

- [ ] **Step 5: Реализация сервера**

`server/src/games/lucid/core/cards.ts`:

```ts
import { LucidShared } from '@trgames/shared';

import { shuffle } from '@/games/lucid/core/random';

export const LAW_SLOTS = 3;

export const LAW_DECK: LucidShared.ELaw[] = Object.values(LucidShared.ELaw)
  .filter(law => law !== LucidShared.ELaw.LAST_START_FREE_CARD);

export const emptyCards = (): LucidShared.TCards => ({
  laws: Array.from({ length: LAW_SLOTS }, () => null),
  lawDeck: [],
  lawDiscard: [],
  lawDraw: [],
});

export const createCards = (random: LucidShared.TRandomState): LucidShared.TCards => ({
  ...emptyCards(),
  lawDeck: shuffle(random, LAW_DECK).value,
});
```

`server/src/games/lucid/core/turn.ts`:

```ts
import { LucidShared } from '@trgames/shared';

export const freshTurn = (): LucidShared.TTurn => ({
  step: LucidShared.ETurnStep.START,
  fired: [],
  extraTurn: false,
});
```

`server/src/games/lucid/core/upgrade.ts`:

```ts
import type { LucidShared } from '@trgames/shared';

import { emptyCards } from '@/games/lucid/core/cards';
import { freshTurn } from '@/games/lucid/core/turn';

export const upgradeG = (G: LucidShared.TG): LucidShared.TG => ({
  ...G,
  cellHistory: G.cellHistory ?? {},
  cards: { ...emptyCards(), ...G.cards },
  turn: G.turn ?? freshTurn(),
});
```

`core/setup.ts`: в `G` добавить `cards: createCards(createRandom(`${seed}:cards`)),` и `turn: freshTurn(),`.

`room/Party.ts` (`fromSnapshot`): заменить `G: { ...snapshot.state.G, cellHistory: snapshot.state.G.cellHistory ?? {} }` на `G: upgradeG(snapshot.state.G)`.

`vitest/factories.ts` (`makeG`): добавить `cards: emptyCards(),` и `turn: freshTurn(),`.

`core/formatForPlayer.ts`: добавить функцию и поля:

```ts
const toOpenEventView = (event: LucidShared.TEvent): LucidShared.TEventView => ({
  cellId: event.cellId,
  title: event.title,
  text: event.text,
  options: event.options.map(option => ({
    text: option.text,
    threshold: option.threshold,
    cost: option.cost,
    revealed: { success: true, failure: Boolean(option.failure) },
    success: option.success,
    failure: option.failure,
  })),
});
```

Тип `G` в `formatForPlayer` заменить на `LucidShared.TStateForPlayer['G']`. В объект добавить:

```ts
    cards: { laws: state.G.cards.laws, lawDraw: state.G.cards.lawDraw },
    turn: { ...state.G.turn, lawEvent: state.G.turn.lawEvent && toOpenEventView(state.G.turn.lawEvent) },
```

- [ ] **Step 6: Клиентские истории**

В `Board.stories.tsx` и `Hud.stories.tsx` в каждый объект `G` состояния добавить:

```ts
cards: { laws: [null, null, null], lawDraw: [] },
turn: { step: LucidShared.ETurnStep.START, fired: [], extraTurn: false },
```

Run: `yarn workspace @trgames/client typecheck` — Expected: без ошибок. Другие места с ошибками типов — поправить так же.

- [ ] **Step 7: Тесты и линт**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS.
Run: `yarn workspace @trgames/shared lint && yarn workspace @trgames/server lint && yarn workspace @trgames/client lint` — Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A tools/shared server/src/games/lucid client/src/routes/games/lucid
git commit -m "feat(lucid): типы законов и шагов хода, колода законов в партии"
```

---

### Task 2: Машина шагов хода

Чистый рефакторинг: поведение партии не меняется, все старые тесты проходят без правок ожиданий.

**Files:**
- Modify: `server/src/games/lucid/core/turn.ts`, `core/reducer.ts`
- Test: `server/src/games/lucid/core/turn.test.ts`

**Interfaces:**
- Consumes: `freshTurn()` (задача 1).
- Produces: `startTurn(state)`, `nextTurn(state)`, `land(state)`, `proceed(state)`, `currentEvent(G)`, `withTurn(G, patch)`. Дальше их зовут задачи 3–5, 8–10.

- [ ] **Step 1: Падающий тест**

`server/src/games/lucid/core/turn.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import {
  nextTurn,
  proceed,
  withTurn,
} from '@/games/lucid/core/turn';

const makeState = (G = makeG()): LucidShared.TState => ({
  G,
  ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
  stateId: 0,
});

describe('машина хода', () => {
  it('после клетки ход доходит до конца и переходит к следующему', () => {
    const state = makeState(withTurn(makeG(), { step: LucidShared.ETurnStep.LANDED }));
    const next = proceed(state);

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(next.G.turn).toEqual({ step: LucidShared.ETurnStep.START, fired: [], extraTurn: false });
  });

  it('ход ещё раз оставляет того же игрока', () => {
    const state = makeState(withTurn(makeG(), { extraTurn: true }));
    const next = nextTurn(state);

    expect(next.ctx.currentPlayer).toBe('a');
    expect(next.ctx.turn).toBe(2);
    expect(next.G.turn.extraTurn).toBe(false);
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/turn.test.ts`
Expected: FAIL — `proceed` не экспортирован.

- [ ] **Step 3: Реализация `core/turn.ts`**

```ts
import { LucidShared } from '@trgames/shared';

import { landOnCell } from '@/games/lucid/core/cells';

export const freshTurn = (): LucidShared.TTurn => ({
  step: LucidShared.ETurnStep.START,
  fired: [],
  extraTurn: false,
});

export const withTurn = (G: LucidShared.TG, patch: Partial<LucidShared.TTurn>): LucidShared.TG => ({
  ...G,
  turn: { ...G.turn, ...patch },
});

const withPhase = (state: LucidShared.TState, phase: LucidShared.EPhase): LucidShared.TState => ({
  ...state,
  ctx: { ...state.ctx, phase },
});

export const currentEvent = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TEvent | undefined =>
  G.turn.lawEvent ?? G.events[G.turn.eventCellId ?? G.players[playerId].position];

const isAffordable = (event: LucidShared.TEvent | undefined, player: LucidShared.TPlayer): boolean =>
  Boolean(event?.options.some(option => !option.cost || option.cost <= player.resource));

export const startTurn = (state: LucidShared.TState): LucidShared.TState =>
  proceed(withPhase({ ...state, G: { ...state.G, turn: freshTurn() } }, LucidShared.EPhase.ROLL));

export const nextTurn = (state: LucidShared.TState): LucidShared.TState => {
  const index = state.G.order.indexOf(state.ctx.currentPlayer);
  const currentPlayer = state.G.turn.extraTurn
    ? state.ctx.currentPlayer
    : state.G.order[(index + 1) % state.G.order.length];

  return startTurn({ ...state, ctx: { ...state.ctx, currentPlayer, turn: state.ctx.turn + 1 } });
};

export const land = (state: LucidShared.TState): LucidShared.TState => {
  const playerId = state.ctx.currentPlayer;
  const player = state.G.players[playerId];
  const G = withTurn(
    { ...state.G, branchChoices: [], pendingSteps: 0 },
    { step: LucidShared.ETurnStep.LANDED, landedCellId: player.position },
  );

  if (isAffordable(G.events[player.position], player)) {
    return withPhase({ ...state, G }, LucidShared.EPhase.CHOICE);
  }

  return proceed({ ...state, G: landOnCell(G, playerId) });
};

export const proceed = (state: LucidShared.TState): LucidShared.TState => {
  switch (state.G.turn.step) {
    case LucidShared.ETurnStep.START:
      return withPhase(state, LucidShared.EPhase.ROLL);
    case LucidShared.ETurnStep.LANDED:
      return proceed({ ...state, G: withTurn(state.G, { step: LucidShared.ETurnStep.CARDS }) });
    case LucidShared.ETurnStep.CARDS:
      return proceed({ ...state, G: withTurn(state.G, { step: LucidShared.ETurnStep.END }) });
    case LucidShared.ETurnStep.END:
      return nextTurn(state);
  }
};
```

Важно: `startTurn` ставит шаг `START`, а `proceed` на `START` ставит фазу `ROLL`. В задаче 5 сюда встанут законы начала хода. `landOnCell` — тот же, что сейчас (портал, ±3 до задачи 5).

- [ ] **Step 4: Перевести редьюсер на машину хода**

`core/reducer.ts`:
- Удалить `nextPlayer`, `endTurn`. Импортировать `land`, `nextTurn`, `proceed`, `currentEvent`, `withTurn` из `@/games/lucid/core/turn`.
- `afterMove`:

```ts
const afterMove = (state: LucidShared.TState): LucidShared.TState => {
  if (state.G.branchChoices.length > 1) {
    return { ...state, ctx: { ...state.ctx, phase: LucidShared.EPhase.BRANCH } };
  }

  return land(state);
};
```

- `skipTurn`: вместо `nextPlayer(...)` вернуть `nextTurn({ ...state, G })`.
- `OPEN_SAFE`: вместо `nextPlayer(...)` вернуть `nextTurn({ ...state, G })`.
- `ROLL`: перед `rollAndMove` записать позицию до броска: `const rolled = { ...state, G: rollAndMove(withTurn(state.G, { from: player.position }), player.id) };`.
- `CHOOSE_OPTION`: событие брать через `currentEvent(state.G, player.id)`; после `resolveOption` вернуть

```ts
    return proceed({
      ...state,
      G: withTurn({ ...G, branchChoices: [], pendingSteps: 0 }, { eventCellId: undefined, lawEvent: undefined }),
    });
```

- [ ] **Step 5: Тесты**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS, включая все старые тесты `reducer.test.ts`, `cells.test.ts`, `party.integration.test.ts` без правок ожиданий. Если старый тест падает — ошибка в рефакторинге, а не в тесте.

- [ ] **Step 6: Commit**

```bash
git add server/src/games/lucid/core
git commit -m "refactor(lucid): ход — машина шагов START, LANDED, CARDS, END"
```

---

### Task 3: Клетка «Закон» и колода законов

**Files:**
- Modify: `server/src/games/lucid/core/cellTypes.ts`, `core/cards.ts`, `core/turn.ts`, `core/reducer.ts`, `core/autoMove.ts`
- Modify: `docs/lucid/PRD.md` (раздел «Типы клеток», «Числовые параметры», «Словарь», 5.4)
- Test: `core/cellTypes.test.ts`, `core/cards.test.ts`, `core/reducer.test.ts`, `core/autoMove.test.ts`

**Interfaces:**
- Consumes: `land`, `proceed`, `withTurn` (задача 2); `LAW_SLOTS`, `emptyCards` (задача 1).
- Produces: `drawLaws(G, count): TG`, `placeLaw(G, playerId, index): TG | null`. Клетка `LAW` ставит фазу `LAW` с `G.cards.lawDraw` из двух законов; ход `CHOOSE_LAW` кладёт выбранный в левую ячейку.

- [ ] **Step 1: Падающие тесты**

`core/cards.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { drawLaws, placeLaw } from '@/games/lucid/core/cards';

const { ELaw } = LucidShared;

describe('колода законов', () => {
  it('тянет из колоды, пустая колода собирается из сброса', () => {
    const G = makeG();
    const drawn = drawLaws({
      ...G,
      cards: { ...G.cards, lawDeck: [ELaw.SIX_SKIP], lawDiscard: [ELaw.RED_BAD, ELaw.GREEN_AGAIN] },
    }, 2);

    expect(drawn.cards.lawDraw).toHaveLength(2);
    expect(drawn.cards.lawDraw[0]).toBe(ELaw.SIX_SKIP);
    expect(drawn.cards.lawDeck).toHaveLength(1);
    expect(drawn.cards.lawDiscard).toEqual([]);
  });

  it('новый закон встаёт слева, правый уходит в сброс, невыбранный тоже', () => {
    const G = makeG();
    const placed = placeLaw({
      ...G,
      cards: {
        ...G.cards,
        laws: [ELaw.RED_BAD, ELaw.GREEN_AGAIN, ELaw.SIX_SKIP],
        lawDraw: [ELaw.GREEN_RESOURCE, ELaw.RED_PAY_ALL],
      },
    }, 'a', 1)!;

    expect(placed.cards.laws).toEqual([ELaw.RED_PAY_ALL, ELaw.RED_BAD, ELaw.GREEN_AGAIN]);
    expect(placed.cards.lawDiscard).toEqual([ELaw.GREEN_RESOURCE, ELaw.SIX_SKIP]);
    expect(placed.cards.lawDraw).toEqual([]);
    expect(placed.log.at(-2)).toBe('Аня вводит закон «Налог»');
    expect(placed.log.at(-1)).toBe('закон «Шестёрка» отменён');
  });

  it('индекс вне вытянутых — null', () => {
    const G = makeG();

    expect(placeLaw({ ...G, cards: { ...G.cards, lawDraw: [ELaw.RED_BAD] } }, 'a', 1)).toBeNull();
    expect(placeLaw({ ...G, cards: { ...G.cards, lawDraw: [ELaw.RED_BAD] } }, 'a', 0.5)).toBeNull();
  });
});
```

В `core/reducer.test.ts` добавить:

```ts
describe('клетка «Закон»', () => {
  const lawTrack = (): LucidShared.TTrack => ({
    startId: 0,
    finishId: 3,
    cells: [
      { id: 0, type: LucidShared.ECellType.START, next: [1] },
      { id: 1, type: LucidShared.ECellType.LAW, next: [2] },
      { id: 2, type: LucidShared.ECellType.EMPTY, next: [3] },
      { id: 3, type: LucidShared.ECellType.FINISH, next: [] },
    ],
  });

  it('остановка на «Законе» тянет два закона, выбор кладёт закон и передаёт ход', () => {
    const G = makeG({ track: lawTrack() });
    const state: LucidShared.TState = {
      G: {
        ...G,
        players: { ...G.players, a: { ...G.players.a, position: 1 } },
        cards: { ...G.cards, lawDeck: [LucidShared.ELaw.RED_BAD, LucidShared.ELaw.SIX_SKIP] },
      },
      ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
      stateId: 0,
    };
    const landed = land(state);

    expect(landed.ctx.phase).toBe(LucidShared.EPhase.LAW);
    expect(landed.G.cards.lawDraw).toEqual([LucidShared.ELaw.RED_BAD, LucidShared.ELaw.SIX_SKIP]);

    const chosen = applyMove(landed, {
      type: EMoveType.CHOOSE_LAW, playerId: 'a', stateId: landed.stateId, index: 0,
    });

    expect(chosen.G.cards.laws[0]).toBe(LucidShared.ELaw.RED_BAD);
    expect(chosen.ctx.currentPlayer).toBe('b');
    expect(chosen.ctx.phase).toBe(LucidShared.EPhase.ROLL);
  });
});
```

(импорт `land` из `@/games/lucid/core/turn`, `makeG` из фабрик).

В `core/autoMove.test.ts` добавить: состояние в фазе `LAW` → `chooseAutoMove` возвращает `{ type: CHOOSE_LAW, index: 0 }`.

В `core/cellTypes.test.ts` добавить: на треке 100 клеток доли — событий `round(n×0.35)`, зелёных и красных по `round(n×0.12)`, `LAW` `round(n×0.10)`, где `n` — внутренние клетки без порталов.

- [ ] **Step 2: Запустить — падают**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/cards.test.ts`
Expected: FAIL — `drawLaws` не экспортирован.

- [ ] **Step 3: Колода — `core/cards.ts`**

```ts
export const drawLaws = (G: LucidShared.TG, count: number): LucidShared.TG => {
  let { lawDeck, lawDiscard } = G.cards;
  let { random } = G;
  const lawDraw: LucidShared.ELaw[] = [];

  while (lawDraw.length < count) {
    if (lawDeck.length === 0) {
      if (lawDiscard.length === 0) {
        break;
      }

      const reshuffled = shuffle(random, lawDiscard);

      lawDeck = reshuffled.value;
      lawDiscard = [];
      random = reshuffled.state;
    }

    lawDraw.push(lawDeck[0]);
    lawDeck = lawDeck.slice(1);
  }

  return { ...G, random, cards: { ...G.cards, lawDeck, lawDiscard, lawDraw } };
};

export const placeLaw = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  index: number,
): LucidShared.TG | null => {
  const chosen = Number.isInteger(index) ? G.cards.lawDraw[index] : undefined;

  if (chosen === undefined) {
    return null;
  }

  const rest = G.cards.lawDraw.filter((_, drawIndex) => drawIndex !== index);
  const dropped = G.cards.laws[LAW_SLOTS - 1];
  const laws = [chosen, ...G.cards.laws.slice(0, LAW_SLOTS - 1)];
  const lines = [`${G.players[playerId].nickname} вводит закон «${LucidShared.LAW_TEXT[chosen].name}»`];

  if (dropped) {
    lines.push(`закон «${LucidShared.LAW_TEXT[dropped].name}» отменён`);
  }

  return {
    ...G,
    cards: {
      ...G.cards,
      laws,
      lawDraw: [],
      lawDiscard: [...G.cards.lawDiscard, ...rest, ...(dropped ? [dropped] : [])],
    },
    log: [...G.log, ...lines],
  };
};
```

- [ ] **Step 4: Клетка и ход**

`core/turn.ts`, функция `land`: после проверки события добавить ветку

```ts
  const cell = G.track.cells.find(item => item.id === player.position);

  if (cell?.type === LucidShared.ECellType.LAW) {
    const drawn = drawLaws(G, 2);

    if (drawn.cards.lawDraw.length > 0) {
      return withPhase({ ...state, G: drawn }, LucidShared.EPhase.LAW);
    }
  }
```

`core/reducer.ts`: `PHASE_FOR_MOVE[EMoveType.CHOOSE_LAW] = LucidShared.EPhase.LAW`; обработчик:

```ts
  [EMoveType.CHOOSE_LAW]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_LAW) {
      return null;
    }

    const G = placeLaw(state.G, state.ctx.currentPlayer, move.index);

    return G ? proceed({ ...state, G }) : null;
  },
```

`core/autoMove.ts`: фаза `LAW` → `{ type: LucidShared.EMoveType.CHOOSE_LAW, playerId, stateId, index: 0 }`.

`core/cellTypes.ts`: доли `EVENT_SHARE = 0.35`, `GREEN_SHARE = 0.12`, `RED_SHARE = 0.12`, новая `LAW_SHARE = 0.1`; клетки `LAW` идут в раскладке после красных, остальное — `EMPTY`.

- [ ] **Step 5: Старые тесты на сгенерированных треках**

Run: `yarn workspace @trgames/server test --run src/games/lucid`
Тесты, которые бросают кубик на треке из `setupParty`, теперь могут встать на `LAW` и получить фазу `LAW`. Если такой тест ждёт `ROLL` после броска — подобрать сид, при котором бросок не встаёт на `LAW`, или явно задать трек через `makeG`. Ожидания про само поведение не ослаблять.
Expected: PASS.

- [ ] **Step 6: PRD**

`docs/lucid/PRD.md`:
- «Словарь»: строки `| Закон | Карта в одной из трёх общих ячеек; действует на всех, пока не вытеснят | `ELaw`, `G.cards.laws` | «Тадам», «выложенная карта» |` и `| Колода законов | Законы, которые ещё можно вытянуть; порядок — секрет | `G.cards.lawDeck` | — |`.
- «Типы клеток»: строка `LAW` — «игрок тянет два закона, один кладёт в левую ячейку, остальные сдвигаются вправо, правый уходит в сброс; невыбранный — в сброс» — 10%; доли событий 35%, зелёных 12%, красных 12%.
- «Числовые параметры»: новые доли, «ячеек законов 3».
- 5.4: ход `CHOOSE_LAW { index }` в фазе `LAW`.

- [ ] **Step 7: Commit**

```bash
git add server/src/games/lucid docs/lucid/PRD.md
git commit -m "feat(lucid): клетка «Закон» — два закона на выбор, три ячейки"
```

---

### Task 4: Вытянутые события и выбор закона

Законы «Добрый знак», «Удача отстающего», «Дурная примета» и «Пошлина» разыгрывают событие, которого нет на клетке игрока. Задача даёт движку такую возможность. Сами законы — задача 5.

**Files:**
- Create: `server/src/games/lucid/core/calamity.ts`
- Modify: `core/options.ts`, `core/reducer.ts`, `core/autoMove.ts`
- Test: `core/calamity.test.ts`, `core/reducer.test.ts`, `core/autoMove.test.ts`

**Interfaces:**
- Consumes: `currentEvent`, `withTurn`, `proceed` (задача 2).
- Produces: `isCalamity(event): boolean`; `drawEvent(G, kind: 'good' | 'bad'): { G: TG; cellId?: number }` — открывает клетку в `visited`; `resolveOption(G, actorId, optionIndex, option, cellId?)` — без `cellId` история клетки не пишется.

- [ ] **Step 1: Падающие тесты**

`core/calamity.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { drawEvent, isCalamity } from '@/games/lucid/core/calamity';

const { EAtomKind, ETarget } = LucidShared;

const event = (cellId: number, value: number): LucidShared.TEvent => ({
  cellId,
  title: `Событие ${cellId}`,
  text: 'Текст',
  options: [{ text: 'Вариант', success: { atoms: [{ kind: EAtomKind.RESOURCE, target: ETarget.SELF, value }] } }],
});

describe('беда', () => {
  it('беда — ни один вариант не даёт плюса себе', () => {
    expect(isCalamity(event(1, -2))).toBe(true);
    expect(isCalamity(event(1, 2))).toBe(false);
  });

  it('плюс другим игрокам беду не отменяет', () => {
    const helpsLast: LucidShared.TEvent = {
      ...event(1, -2),
      options: [{ text: 'В', success: { atoms: [{ kind: EAtomKind.MOVE, target: ETarget.LAST, value: 2 }] } }],
    };

    expect(isCalamity(helpsLast)).toBe(true);
  });

  it('вытянутая беда открывает свою клетку', () => {
    const drawn = drawEvent(makeG({ events: { 2: event(2, -2), 3: event(3, 2) } }), 'bad');

    expect(drawn.cellId).toBe(2);
    expect(drawn.G.visited).toContain(2);
  });

  it('беды в партии нет — тянуть нечего', () => {
    const drawn = drawEvent(makeG({ events: { 3: event(3, 2) } }), 'bad');

    expect(drawn.cellId).toBeUndefined();
  });
});
```

В `core/reducer.test.ts`:

```ts
it('вытянутое событие разыгрывается вместо клетки игрока и пишет историю своей клетки', () => {
  const base = makeG({ events: { 2: drawnEvent } });
  const state: LucidShared.TState = {
    G: withTurn(base, { step: LucidShared.ETurnStep.LANDED, eventCellId: 2 }),
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.CHOICE },
    stateId: 0,
  };
  const next = applyMove(state, { type: EMoveType.CHOOSE_OPTION, playerId: 'a', stateId: 0, optionIndex: 0 });

  expect(next.G.cellHistory[2]).toHaveLength(1);
  expect(next.G.turn.eventCellId).toBeUndefined();
  expect(next.ctx.currentPlayer).toBe('b');
});

it('выбор закона не пишет историю клеток', () => {
  const state: LucidShared.TState = {
    G: withTurn(makeG(), { step: LucidShared.ETurnStep.LANDED, lawEvent: { ...drawnEvent, cellId: -1 } }),
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.CHOICE },
    stateId: 0,
  };
  const next = applyMove(state, { type: EMoveType.CHOOSE_OPTION, playerId: 'a', stateId: 0, optionIndex: 0 });

  expect(next.G.cellHistory).toEqual({});
  expect(next.G.turn.lawEvent).toBeUndefined();
});
```

`drawnEvent` — событие с одним бесплатным вариантом `RESOURCE SELF +2`, объявить в файле теста.

В `core/autoMove.test.ts`: фаза `CHOICE` с `turn.eventCellId = 2` — автопилот берёт вариант события клетки 2, а не клетки игрока.

- [ ] **Step 2: Запустить — падают**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/calamity.test.ts`
Expected: FAIL — модуля нет.

- [ ] **Step 3: Реализация `core/calamity.ts`**

```ts
import { LucidShared } from '@trgames/shared';

import { randomInt } from '@/games/lucid/core/random';

const isGain = (atom: LucidShared.TAtom): boolean => atom.kind === LucidShared.EAtomKind.SWAP_WITH_FIRST
  || (atom.target === LucidShared.ETarget.SELF && atom.value > 0
    && (atom.kind === LucidShared.EAtomKind.MOVE || atom.kind === LucidShared.EAtomKind.RESOURCE));

const hasGain = (effect?: LucidShared.TEffect): boolean =>
  Boolean(effect && [...effect.atoms, ...(effect.otherwise ?? [])].some(isGain));

export const isCalamity = (event: LucidShared.TEvent): boolean => event.options.length > 0
  && event.options.every(option => !hasGain(option.success) && !hasGain(option.failure));

export const drawEvent = (
  G: LucidShared.TG,
  kind: 'bad' | 'good',
): { G: LucidShared.TG; cellId?: number } => {
  const pool = Object.values(G.events).filter(event => isCalamity(event) === (kind === 'bad'));

  if (pool.length === 0) {
    return { G };
  }

  const picked = randomInt(G.random, 0, pool.length - 1);
  const { cellId } = pool[picked.value];

  return {
    G: {
      ...G,
      random: picked.state,
      visited: G.visited.includes(cellId) ? G.visited : [...G.visited, cellId],
    },
    cellId,
  };
};
```

- [ ] **Step 4: `resolveOption` и редьюсер**

`core/options.ts`: добавить параметр `cellId?: number` последним; убрать строку `const cellId = player.position;`; историю писать только при `cellId !== undefined`:

```ts
  if (cellId === undefined) {
    return resolved;
  }

  return {
    ...resolved,
    cellHistory: { ...resolved.cellHistory, [cellId]: [...(resolved.cellHistory[cellId] ?? []), entry] },
  };
```

`core/reducer.ts`, `CHOOSE_OPTION`:

```ts
    const player = state.G.players[state.ctx.currentPlayer];
    const event = currentEvent(state.G, player.id);
    const option = event?.options[move.optionIndex];

    if (!event || !option) {
      return null;
    }

    const cellId = state.G.turn.lawEvent ? undefined : event.cellId;
    const G = resolveOption(state.G, player.id, move.optionIndex, option, cellId);
```

`core/autoMove.ts`: в фазе `CHOICE` варианты брать из `currentEvent(state.G, playerId)`.

- [ ] **Step 5: Тесты**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/games/lucid/core
git commit -m "feat(lucid): движок разыгрывает вытянутое событие и выбор закона"
```

---

### Task 5: Эффекты законов

**Files:**
- Create: `server/src/games/lucid/core/lawEffects.ts`
- Modify: `core/turn.ts`, `core/cells.ts`, `core/moves.ts`
- Modify: `docs/lucid/PRD.md` («Типы клеток», «Числовые параметры», новый подраздел «Законы» в разделе 3)
- Test: `core/lawEffects.test.ts`, `core/cells.test.ts`

**Interfaces:**
- Consumes: `drawEvent` (задача 4); `land`, `proceed`, `withTurn` (задача 2); `resolveTarget` (`core/targets.ts`); `moveBy` (`core/movement.ts`); `rollDie` (`core/random.ts`).
- Produces: `runLaws(G, playerId, timing): TLawRun`, где `type TLawTiming = 'END' | 'LANDED' | 'ROLLED' | 'START'`, `interface TLawRun { G: TG; pause?: TLawPause }`, `type TLawPause = { kind: 'EVENT'; cellId } | { kind: 'LAND' } | { kind: 'LAW_EVENT'; event }`; в `turn.ts` — `applyPause(state, run): TState | null`. `proceed` зовёт `runLaws` на шагах `START`, `LANDED`, `END`; `land` — с `'ROLLED'`, если в `turn.from` есть позиция.

Правила срабатывания (одинаковы для всех законов):
- Законы идут слева направо по ячейкам. Каждый срабатывает не больше раза за ход (`turn.fired`).
- «Отстающий» — `ETarget.LAST`, единственный дальний от финиша. Ничья — закон не срабатывает. Закон начала и конца хода смотрит только на ходящего игрока.
- Законы цвета смотрят на `turn.landedCellId`, а не на текущую позицию.
- Движение вперёд законом («Тропа», «Попутный ветер») вызывает `land`: клетка срабатывает. На развилке идёт первая ветка (`moveBy`). Игрок у сейфа не двигается.
- Закон, которому нужно событие, ставит `turn.eventCellId` или `turn.lawEvent` и фазу `CHOICE`. После выбора `proceed` продолжает тот же шаг: сработавшие законы пропускаются.
- Зелёная и красная клетки сами ничего не дают: из `landOnCell` убрать `GREEN`/`RED`, удалить `GREEN_REWARD`, `RED_PENALTY`, `withResource`.

- [ ] **Step 1: Падающие тесты**

`core/lawEffects.test.ts` — по тесту на каждый закон. Каркас:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import {
  land,
  proceed,
  withTurn,
} from '@/games/lucid/core/turn';

const { ECellType, ELaw, EPhase, ETurnStep } = LucidShared;

const colorTrack = (types: LucidShared.ECellType[]): LucidShared.TTrack => ({
  startId: 0,
  finishId: types.length + 1,
  cells: [
    { id: 0, type: ECellType.START, next: [1] },
    ...types.map((type, index) => ({ id: index + 1, type, next: [index + 2] })),
    { id: types.length + 1, type: ECellType.FINISH, next: [] },
  ],
});

const stateWith = (
  laws: LucidShared.ELaw[],
  types: LucidShared.ECellType[],
  positions: Record<string, number>,
  resource = 10,
): LucidShared.TState => {
  const G = makeG({
    track: colorTrack(types),
    players: Object.entries(positions).map(([id, position]) => ({
      id, nickname: id === 'a' ? 'Аня' : 'Боря', position, resource,
    })),
  });

  return {
    G: { ...G, cards: { ...G.cards, laws: [...laws, null, null, null].slice(0, 3) } },
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: EPhase.ROLL },
    stateId: 0,
  };
};

describe('законы цвета', () => {
  it('без законов зелёная ничего не даёт', () => {
    const next = land(stateWith([], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(10);
  });

  it('«Урожай»: зелёная +5', () => {
    const next = land(stateWith([ELaw.GREEN_RESOURCE], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(15);
  });

  it('«Тропа» срабатывает один раз, даже если привела на зелёную', () => {
    const types = [ECellType.GREEN, ...Array(6).fill(ECellType.EMPTY), ECellType.GREEN, ECellType.EMPTY];
    const next = land(stateWith([ELaw.GREEN_ADVANCE], types, { a: 1, b: 0 }));

    expect(next.G.players.a.position).toBe(8);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Второе дыхание»: снова ходит тот же игрок', () => {
    const next = land(stateWith([ELaw.GREEN_AGAIN], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.ctx.currentPlayer).toBe('a');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
  });

  it('«Налог» вдвоём: отдаёшь 4, не больше, чем есть', () => {
    const next = land(stateWith([ELaw.RED_PAY_ALL], [ECellType.RED], { a: 1, b: 0 }, 3));

    expect(next.G.players.a.resource).toBe(0);
    expect(next.G.players.b.resource).toBe(6);
  });

  it('«Пошлина» предлагает выбор из двух вариантов', () => {
    const next = land(stateWith([ELaw.RED_CHOICE], [ECellType.RED], { a: 1, b: 0 }));

    expect(next.ctx.phase).toBe(EPhase.CHOICE);
    expect(next.G.turn.lawEvent?.options).toHaveLength(2);
  });

  it('«Дурная примета» без бед в партии — ход идёт дальше', () => {
    const next = land(stateWith([ELaw.RED_BAD], [ECellType.RED], { a: 1, b: 0 }));

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
  });
});
```

Дописать тесты по той же схеме:
- «Добрый знак»: в партии есть событие без беды на клетке 5 → фаза `CHOICE`, `turn.eventCellId === 5`; после `CHOOSE_OPTION` ход у `b`.
- «Подножка»: `turn.from = 1`, `a` встал на 4, `b` стоит на 3 с Ресурсом 10 → у `a` +3, у `b` −3. Если `b` стоял на 1 (там же, откуда `a` начал), он тоже обогнан. Если `b` впереди на 5 — не обогнан.
- «Шестёрка»: `lastRoll = { playerId: 'a', value: 6 }`, `turn.from` задан → `skipTurns` у `a` = 1. Для двух кубиков `values: [2, 6]` — тоже 1.
- «Дубль»: `lastRoll.values = [3, 3]` → следующий ход снова у `a`. `values: [3, 4]` — у `b`.
- «Пособие»: `a` отстающий, `startTurn` для `a` → Ресурс +3. Ничья по позиции — не срабатывает.
- «Удача отстающего»: `a` отстающий, в партии есть событие без беды → после `startTurn` фаза `CHOICE`; после выбора — фаза `ROLL`, ход всё ещё у `a`.
- «Попутный ветер»: шаг `END`, `a` отстающий → позиция +5, затем ход у `b`.
- «Лотерея»: шаг `END`, `a` отстающий → Ресурс вырос на 1…6, строка ленты с выпавшим числом.
- Порядок: «Урожай» в ячейке 0 и «Налог» в ячейке 1 на одной красной клетке не пересекаются; проверить, что два закона цвета одной клетки оба срабатывают слева направо: «Урожай» и «Второе дыхание» на зелёной → Ресурс +5 и снова ход `a`.

`core/cells.test.ts`: тесты про ±3 заменить одним — зелёная и красная клетки не меняют Ресурс и не пишут ленту.

- [ ] **Step 2: Запустить — падают**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/lawEffects.test.ts`
Expected: FAIL.

- [ ] **Step 3: Реализация `core/lawEffects.ts`**

```ts
import { LucidShared } from '@trgames/shared';

import { drawEvent } from '@/games/lucid/core/calamity';
import { resolveTarget } from '@/games/lucid/core/targets';
import { moveBy } from '@/games/lucid/core/movement';
import { rollDie } from '@/games/lucid/core/random';

export type TLawTiming = 'END' | 'LANDED' | 'ROLLED' | 'START';

export type TLawPause =
  | { kind: 'EVENT'; cellId: number }
  | { kind: 'LAND' }
  | { kind: 'LAW_EVENT'; event: LucidShared.TEvent };

interface TLawContext {
  G: LucidShared.TG;
  playerId: LucidShared.TPlayerId;
}

interface TLawEffect {
  timing: TLawTiming;
  applies: (context: TLawContext) => boolean;
  apply: (context: TLawContext) => { G: LucidShared.TG; pause?: TLawPause };
}

const { ECellType, ELaw } = LucidShared;

const log = (G: LucidShared.TG, line: string): LucidShared.TG => ({ ...G, log: [...G.log, line] });

const lawLine = (law: LucidShared.ELaw, playerId: LucidShared.TPlayerId, G: LucidShared.TG, what: string): string =>
  `закон «${LucidShared.LAW_TEXT[law].name}»: ${G.players[playerId].nickname} — ${what}`;

const addResource = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, delta: number): LucidShared.TG => ({
  ...G,
  players: {
    ...G.players,
    [playerId]: { ...G.players[playerId], resource: Math.max(G.players[playerId].resource + delta, 0) },
  },
});

const landedType = ({ G }: TLawContext): LucidShared.ECellType | undefined =>
  G.track.cells.find(cell => cell.id === G.turn.landedCellId)?.type;

const isLast = ({ G, playerId }: TLawContext): boolean => resolveTarget(G, playerId, LucidShared.ETarget.LAST)[0] === playerId;

const rolledValues = ({ G }: TLawContext): number[] =>
  G.lastRoll?.values ?? (G.lastRoll ? [G.lastRoll.value] : []);

const advance = (law: LucidShared.ELaw, steps: number) => ({ G, playerId }: TLawContext) => {
  const player = G.players[playerId];

  if (player.position === G.track.finishId) {
    return { G };
  }

  const moved = {
    ...G,
    players: { ...G.players, [playerId]: { ...player, position: moveBy(G.track, player.position, steps) } },
  };

  return { G: log(moved, lawLine(law, playerId, G, `+${steps} клеток`)), pause: { kind: 'LAND' } as const };
};

const playEvent = (law: LucidShared.ELaw, kind: 'bad' | 'good') => ({ G, playerId }: TLawContext) => {
  const drawn = drawEvent(G, kind);

  if (drawn.cellId === undefined) {
    return { G: log(G, lawLine(law, playerId, G, kind === 'bad' ? 'бед в этом мире нет' : 'событий нет')) };
  }

  return {
    G: log(drawn.G, lawLine(law, playerId, G, `событие «${G.events[drawn.cellId].title}»`)),
    pause: { kind: 'EVENT', cellId: drawn.cellId } as const,
  };
};

const tollEvent = (resourceName: string): LucidShared.TEvent => ({
  cellId: -1,
  title: LucidShared.LAW_TEXT[ELaw.RED_CHOICE].name,
  text: LucidShared.LAW_TEXT[ELaw.RED_CHOICE].rule(resourceName),
  options: [
    {
      text: `Отдать ${resourceName}: 3`,
      success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: -3 }] },
    },
    {
      text: 'Отступить на 3 клетки',
      success: { atoms: [{ kind: LucidShared.EAtomKind.MOVE, target: LucidShared.ETarget.SELF, value: -3 }] },
    },
  ],
});

const LAW_EFFECTS: Partial<Record<LucidShared.ELaw, TLawEffect>> = {
  [ELaw.GREEN_RESOURCE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: ({ G, playerId }) => ({
      G: log(addResource(G, playerId, 5), lawLine(ELaw.GREEN_RESOURCE, playerId, G, `${G.theme.resourceName} +5`)),
    }),
  },
  [ELaw.GREEN_ADVANCE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: advance(ELaw.GREEN_ADVANCE, 7),
  },
  [ELaw.GREEN_AGAIN]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: ({ G, playerId }) => ({
      G: log({ ...G, turn: { ...G.turn, extraTurn: true } }, lawLine(ELaw.GREEN_AGAIN, playerId, G, 'ходит ещё раз')),
    }),
  },
  [ELaw.GREEN_GOOD]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: playEvent(ELaw.GREEN_GOOD, 'good'),
  },
  [ELaw.RED_BAD]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: playEvent(ELaw.RED_BAD, 'bad'),
  },
  [ELaw.RED_CHOICE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: ({ G }) => ({ G, pause: { kind: 'LAW_EVENT', event: tollEvent(G.theme.resourceName) } }),
  },
  [ELaw.RED_PAY_ALL]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: ({ G, playerId }) => {
      const others = G.order.filter(id => id !== playerId);
      const share = others.length === 1 ? 4 : 2;
      const paid = others.reduce((state, id) => {
        const given = Math.min(state.players[playerId].resource, share);

        return addResource(addResource(state, playerId, -given), id, given);
      }, G);

      return { G: log(paid, lawLine(ELaw.RED_PAY_ALL, playerId, G, `платит по ${share}`)) };
    },
  },
  [ELaw.OVERTAKE_STEAL]: {
    timing: 'ROLLED',
    applies: () => true,
    apply: ({ G, playerId }) => {
      const depths = LucidShared.trackDepths(G.track);
      const from = depths[G.turn.from ?? G.players[playerId].position] ?? 0;
      const to = depths[G.players[playerId].position] ?? 0;
      const overtaken = G.order.filter(id => id !== playerId)
        .filter(id => (depths[G.players[id].position] ?? 0) >= from && (depths[G.players[id].position] ?? 0) < to);

      if (overtaken.length === 0) {
        return { G };
      }

      const stolen = overtaken.reduce((state, id) => {
        const taken = Math.min(state.players[id].resource, 3);

        return addResource(addResource(state, id, -taken), playerId, taken);
      }, G);
      const names = overtaken.map(id => G.players[id].nickname).join(', ');

      return { G: log(stolen, lawLine(ELaw.OVERTAKE_STEAL, playerId, G, `забирает у: ${names}`)) };
    },
  },
  [ELaw.SIX_SKIP]: {
    timing: 'ROLLED',
    applies: context => rolledValues(context).includes(6),
    apply: ({ G, playerId }) => ({
      G: log(
        { ...G, players: { ...G.players, [playerId]: { ...G.players[playerId], skipTurns: G.players[playerId].skipTurns + 1 } } },
        lawLine(ELaw.SIX_SKIP, playerId, G, 'пропустит следующий ход'),
      ),
    }),
  },
  [ELaw.DOUBLE_AGAIN]: {
    timing: 'ROLLED',
    applies: context => {
      const values = rolledValues(context);

      return values.length === 2 && values[0] === values[1];
    },
    apply: ({ G, playerId }) => ({
      G: log({ ...G, turn: { ...G.turn, extraTurn: true } }, lawLine(ELaw.DOUBLE_AGAIN, playerId, G, 'ходит ещё раз')),
    }),
  },
  [ELaw.LAST_START_RESOURCE]: {
    timing: 'START',
    applies: isLast,
    apply: ({ G, playerId }) => ({
      G: log(addResource(G, playerId, 3), lawLine(ELaw.LAST_START_RESOURCE, playerId, G, `${G.theme.resourceName} +3`)),
    }),
  },
  [ELaw.LAST_START_GOOD]: {
    timing: 'START',
    applies: isLast,
    apply: playEvent(ELaw.LAST_START_GOOD, 'good'),
  },
  [ELaw.LAST_END_ADVANCE]: {
    timing: 'END',
    applies: isLast,
    apply: advance(ELaw.LAST_END_ADVANCE, 5),
  },
  [ELaw.LAST_END_DIE]: {
    timing: 'END',
    applies: isLast,
    apply: ({ G, playerId }) => {
      const rolled = rollDie(G.random);

      return {
        G: log(
          addResource({ ...G, random: rolled.state }, playerId, rolled.value),
          lawLine(ELaw.LAST_END_DIE, playerId, G, `выпало ${rolled.value}, ${G.theme.resourceName} +${rolled.value}`),
        ),
      };
    },
  },
};

export interface TLawRun {
  G: LucidShared.TG;
  pause?: TLawPause;
}

export const runLaws = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, timing: TLawTiming): TLawRun => {
  let current = G;

  for (const law of G.cards.laws) {
    const effect = law ? LAW_EFFECTS[law] : undefined;

    if (!law || !effect || effect.timing !== timing || current.turn.fired.includes(law)) {
      continue;
    }

    if (!effect.applies({ G: current, playerId })) {
      continue;
    }

    const fired = { ...current, turn: { ...current.turn, fired: [...current.turn.fired, law] } };
    const result = effect.apply({ G: fired, playerId });

    if (result.pause) {
      return result;
    }

    current = result.G;
  }

  return { G: current };
};
```

- [ ] **Step 4: Встроить законы в машину хода — `core/turn.ts`**

```ts
const applyPause = (state: LucidShared.TState, run: TLawRun): LucidShared.TState | null => {
  const next = { ...state, G: run.G };

  switch (run.pause?.kind) {
    case 'EVENT':
      return withPhase({ ...next, G: withTurn(next.G, { eventCellId: run.pause.cellId }) }, LucidShared.EPhase.CHOICE);
    case 'LAW_EVENT':
      return withPhase({ ...next, G: withTurn(next.G, { lawEvent: run.pause.event }) }, LucidShared.EPhase.CHOICE);
    case 'LAND':
      return land(next);
    default:
      return null;
  }
};
```

- `land`: в начале, если `G.turn.from !== undefined`, выполнить `runLaws(G, playerId, 'ROLLED')` и сбросить `from` (`withTurn(..., { from: undefined })`) до проверки события; пауза → `applyPause`.
- `proceed`, шаг `START`: `const run = runLaws(state.G, state.ctx.currentPlayer, 'START');` → `applyPause(state, run) ?? withPhase({ ...state, G: run.G }, EPhase.ROLL)`.
- Шаг `LANDED`: `runLaws(..., 'LANDED')` → пауза или переход к `CARDS`.
- Шаг `END`: `runLaws(..., 'END')` → пауза или `nextTurn`.

`core/cells.ts`: оставить в `landOnCell` только `PORTAL`.

- [ ] **Step 5: Тесты**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS, включая `party.integration.test.ts` (автоигра до победы на 2–6 игроках).

- [ ] **Step 6: PRD**

Добавить в раздел 3 подраздел «Законы»: таблица 14 законов (название, когда срабатывает, что делает) по `LAW_TEXT`; правила срабатывания из начала этой задачи; строки ленты «закон «{название}»: {ник} — {что}». В «Типы клеток» у `GREEN`/`RED` — «сами ничего не дают; смысл им дают законы». В «Числовых параметрах» убрать «Зелёная / красная клетка +3/−3». В «Словарь» добавить «Беда — событие, где ни один вариант не даёт плюса себе; определяется по содержимому (`core/calamity.ts`)».

- [ ] **Step 7: Commit**

```bash
git add server/src/games/lucid docs/lucid/PRD.md
git commit -m "feat(lucid): законы срабатывают — цвет клетки, бросок, начало и конец хода"
```

---

### Task 6: Клиент — законы на экране

**Files:**
- Modify: `client/src/lib/lucid/cellLook.ts` (+ `cellLook.test.ts`)
- Create: `client/src/routes/games/lucid/PartyPage/components/LawsStrip/index.tsx`
- Create: `client/src/routes/games/lucid/PartyPage/components/CardPick/index.tsx`
- Modify: `client/src/routes/games/lucid/PartyPage/components/Hud/index.tsx`
- Modify: `docs/lucid/PRD.md` (6.3, 6.4)

**Interfaces:**
- Consumes: `state.G.cards.laws`, `state.G.cards.lawDraw`, `state.G.turn.lawEvent`, `state.G.turn.eventCellId`, `LucidShared.LAW_TEXT`, ход `CHOOSE_LAW`.
- Produces: `CardPick` — модалка выбора карты, её же берёт Лавка (задача 12):

```ts
interface TCardPickItem {
  key: string;
  name: string;
  rule: string;
  actionLabel: string;
  disabled?: boolean;
}

interface TCardPickProps {
  title: string;
  items: TCardPickItem[];
  isSent: boolean;
  onPick: (index: number) => void;
  onSkip?: () => void;
  skipLabel?: string;
}
```

- [ ] **Step 1: Падающий тест облика клетки**

`client/src/lib/lucid/cellLook.test.ts`:

```ts
it('клетка «Закон» видна сразу и с глифом', () => {
  const look = cellLook({ id: 1, type: LucidShared.ECellType.LAW, next: [] }, false);

  expect(look).toEqual({ fill: LAW_FILL, glyph: '§' });
});
```

Run: `yarn workspace @trgames/client test --run src/lib/lucid/cellLook.test.ts` — Expected: FAIL.

- [ ] **Step 2: Облик клетки**

`cellLook.ts`: `export const LAW_FILL = '#c9a227';` и ветка `case LucidShared.ECellType.LAW: return { fill: LAW_FILL, glyph: '§' };`.

Run тот же тест — Expected: PASS.

- [ ] **Step 3: Полоса законов**

`LawsStrip/index.tsx` — `observer`, читает `partyStore.state`. Три мини-карточки в ряд (`grid grid-cols-3 gap-2`), каждая — рамка `border` цвета `var(--lucid-muted)`, внутри название `text-xs font-unbounded` и правило `text-[11px]` через `LAW_TEXT[law].rule(theme.resourceName)`. Пустая ячейка — пунктирная рамка и текст «пусто». Подпись над рядом не нужна. Поставить в `Hud` внутрь `<header>` под списком игроков. На ширине 360px текст правила переносится, ячейки остаются в одном ряду. Отступ поля сверху в `PartyPage/index.tsx` (`pt-16`) увеличить так, чтобы полоса не закрывала первый ряд клеток (проверить в Storybook или браузере).

- [ ] **Step 4: Модалка выбора карты**

`CardPick/index.tsx` — полноэкранная карточка в стиле `EventCard` (взять разметку и стили оттуда: затемнение поля, рамка, кнопки `Button variant="outline"`). Заголовок `title`; список `items`: название, правило, кнопка `actionLabel` → `onPick(index)`; `disabled || isSent` блокирует кнопку. Если передан `onSkip` — внизу кнопка `skipLabel`.

- [ ] **Step 5: Hud**

- Фаза `LAW`, мой ход: показать `CardPick` с `title="Закон: какой ввести?"`, `items` из `state.G.cards.lawDraw` (`actionLabel: 'Ввести'`), `onPick` шлёт `{ type: EMoveType.CHOOSE_LAW, index, playerId: state.you, stateId: state.stateId }` и ставит `setSentStateId`.
- Фаза `LAW`, чужой ход: в `renderAction` текст «{ник} выбирает закон».
- Событие в фазе `CHOICE` брать так: `state.G.turn.lawEvent ?? state.G.events[state.G.turn.eventCellId ?? current.position]`. То же выражение — для `currentEventCellId` (для `lawEvent` — `undefined`, итог не показывается, строки есть в ленте).

- [ ] **Step 6: Проверка**

Run: `yarn workspace @trgames/client lint` — Expected: PASS.
Запустить `yarn start:dev`, открыть партию в двух изолированных вкладках (как в `docs/lucid/CHECK.md`), дойти до клетки «Закон»: модалка выбора у ходящего, текст ожидания у второго, закон в полосе у обоих.

- [ ] **Step 7: PRD и commit**

PRD 6.3 — новые компоненты `LawsStrip`, `CardPick`; 6.4 — облик клетки `LAW`.

```bash
git add client/src docs/lucid/PRD.md
git commit -m "feat(lucid): законы на экране — полоса ячеек, выбор закона, клетка «Закон»"
```

---

### Task 7: Замер части 1 и документы

**Files:**
- Create: `server/src/games/lucid/reports/runBalanceReport.ts`, `reports/balance.ts`, `reports/balance.test.ts`
- Modify: `server/package.json` (скрипт `lucid:balance`)
- Modify: `docs/lucid/CHECK.md`, `docs/lucid/PRD.md` (раздел 10), `docs/lucid/OPEN-QUESTIONS.md`, `docs/lucid/CONTEXT.md`

**Interfaces:**
- Produces: `measureParties({ playerCounts, seeds }): TBalanceRow[]`, где `TBalanceRow = { players: number; turnsPerPlayer: number; lawsPlaced: number; drawnEvents: number }` — средние по сидам.

- [ ] **Step 1: Падающий тест**

`reports/balance.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';

import { measureParties } from '@/games/lucid/reports/balance';

describe('замер партий автоигрой', () => {
  it('каждая партия доходит до победы и считает ходы', () => {
    const rows = measureParties({ playerCounts: [2, 4], seeds: ['a', 'b'] });

    expect(rows.map(row => row.players)).toEqual([2, 4]);
    rows.forEach(row => expect(row.turnsPerPlayer).toBeGreaterThan(5));
  });
});
```

- [ ] **Step 2: Реализация**

`reports/balance.ts`: для каждого состава и сида — `makeFallbackParty({ seed, playerCount })` из `vitest/factories.ts` (перенести функцию в `core/` или импортировать как есть — фабрика уже без зависимостей от vitest), затем цикл `chooseAutoMove` + `applyMove` до `EPhase.ENDED`, потолок 5000 ходов (превышение — бросить ошибку с сидом). Считать: ходов на игрока = `ctx.turn / players`; законов введено — строк ленты с « вводит закон »; вытянутых событий — смен `turn.eventCellId` с `undefined` на число. Вернуть средние.

`reports/runBalanceReport.ts`: вызвать `measureParties({ playerCounts: [2, 3, 4, 5, 6], seeds: 20 сидов 'balance-1'…'balance-20' })` и напечатать таблицу `console.table`.

`server/package.json`: `"lucid:balance": "ts-node -r tsconfig-paths/register src/games/lucid/reports/runBalanceReport.ts"`.

Run: `yarn workspace @trgames/server test --run src/games/lucid/reports/balance.test.ts` — Expected: PASS.

- [ ] **Step 3: Замер**

Run: `yarn workspace @trgames/server lucid:balance`
Записать таблицу в `docs/lucid/CHECK.md` новым разделом «Итерация 2: законы, замер автоигрой (дата)» с оговоркой: автопилот берёт первый вариант и первый закон, людей он не заменяет. Сравнить с итерацией 1 (~13–14 ходов на игрока).

- [ ] **Step 4: Документы**

- `OPEN-QUESTIONS.md`, «Решения, принятые самостоятельно» — решения владельца 2026-10-03, статус «одобрено 2026-10-03»: «Хорошо/Плохо» не делаем, закон играет событие или беду; зелёная и красная клетки без ±3; доли клеток 35/12/12/10/10; законы слева направо; движение законом активирует клетку, каждый закон раз за ход; название «Закон». Свои решения исполнителя — со статусом «ждёт апрува»: движение законом вперёд идёт по первой ветке развилки; «Подножка» только при броске; беда определяется по содержимому.
- `OPEN-QUESTIONS.md`, раздел «Вторая версия»: пункт 2 и 8 — ссылка на это решение («Тадам» → «Закон», «Хорошо/Плохо» вычеркнуто).
- `CONTEXT.md`: «Выложенная карта» переименовать в «Закон» с тем же смыслом; убрать упоминание «Тадама».
- `PRD.md`, раздел 10: «Итерация 2 сделана», ссылка на замер в `CHECK.md`.

- [ ] **Step 5: Commit**

```bash
git add server docs/lucid
git commit -m "docs(lucid): итерация 2 — законы, замер автоигрой"
```

---

# Часть 2. Лавка

### Task 8: Лавка и рука

**Files:**
- Modify: `tools/shared/src/games/lucid/types/cards.ts`, `cardText.ts`, `types/state.ts`, `types/track.ts`, `types/move.ts`, `types/view.ts`
- Modify: `server/src/games/lucid/core/cards.ts`, `core/cellTypes.ts`, `core/turn.ts`, `core/reducer.ts`, `core/autoMove.ts`, `core/lawEffects.ts`, `core/formatForPlayer.ts`
- Modify: `client/.../Board.stories.tsx`, `Hud.stories.tsx` (поля вида)
- Modify: `docs/lucid/PRD.md`
- Test: `core/shop.test.ts`, `core/cards.test.ts`, `core/autoMove.test.ts`, `core/formatForPlayer.test.ts`, `core/lawEffects.test.ts`

**Interfaces:**
- Produces: `LucidShared.EShopCard`, `LucidShared.THandCard = { uid: number; card: EShopCard }`, `LucidShared.SHOP_TEXT: Record<EShopCard, TShopCardText>` где `TShopCardText = TCardText & { kind: 'active' | 'passive' }`; константы в `cardText.ts`: `HAND_LIMIT = 3`, `SHOP_PRICE = 5`, `CARD_USE_PRICE = 3`, `SHOP_OFFER = 3`; `ECellType.SHOP`, `EPhase.SHOP`, ход `BUY_CARD { index: number | null; discardUid?: number }`; `TCards` + `shopDeck`, `shopDiscard`, `shopOffer: THandCard[]`, `hands: Record<TPlayerId, THandCard[]>`; `TCardsView` + `shopOffer`, `hands`. Сервер: `openShop(G): TG`, `buyCard(G, playerId, index, discardUid?): TG | null`, `giveCard(G, playerId): TG`.

- [ ] **Step 1: Типы и тексты**

`types/cards.ts`:

```ts
export enum EShopCard {
  CLOVER = 'CLOVER',
  GRENADE = 'GRENADE',
  HAND_OF_FATE = 'HAND_OF_FATE',
  HARPOON = 'HARPOON',
  HOOK = 'HOOK',
  MAGIC_DIE = 'MAGIC_DIE',
  MONEY_MAGNET = 'MONEY_MAGNET',
  ROCKET = 'ROCKET',
  TRAVELATOR = 'TRAVELATOR',
  VOODOO = 'VOODOO',
}

export interface THandCard {
  uid: number;
  card: EShopCard;
}
```

В `TCards` добавить `shopDeck: THandCard[]; shopDiscard: THandCard[]; shopOffer: THandCard[]; hands: Record<string, THandCard[]>;`.

`cardText.ts` — названия и правила наши:

```ts
export const HAND_LIMIT = 3;
export const SHOP_PRICE = 5;
export const CARD_USE_PRICE = 3;
export const SHOP_OFFER = 3;

export interface TShopCardText extends TCardText {
  kind: 'active' | 'passive';
}

export const SHOP_TEXT: Record<EShopCard, TShopCardText> = {
  [EShopCard.CLOVER]: { name: 'Подкова', kind: 'passive', rule: resource => `Остановился на пустой: ${resource} +4` },
  [EShopCard.GRENADE]: {
    name: 'Обвал', kind: 'active', rule: resource => `Отдай ${resource} 3 — ближайший впереди отступает на 6 клеток`,
  },
  [EShopCard.HAND_OF_FATE]: {
    name: 'Толчок',
    kind: 'active',
    rule: resource => `Отдай ${resource} 3 — выбранный игрок отступает на 4 клетки`,
  },
  [EShopCard.HARPOON]: {
    name: 'Аркан',
    kind: 'active',
    rule: resource => `Отдай ${resource} 3 — ближайший впереди, если до него не больше 10 клеток, встаёт на твою клетку`,
  },
  [EShopCard.HOOK]: {
    name: 'Кошка',
    kind: 'active',
    rule: resource => `Отдай ${resource} 3 — встань на клетку ближайшего впереди, если до него не больше 10 клеток; клетка сработает`,
  },
  [EShopCard.MAGIC_DIE]: { name: 'Утяжелённый кубик', kind: 'passive', rule: () => '+1 к броску на движение' },
  [EShopCard.MONEY_MAGNET]: { name: 'Громоотвод', kind: 'passive', rule: resource => `Остановился на красной: ${resource} +5` },
  [EShopCard.ROCKET]: {
    name: 'Рывок', kind: 'active', rule: resource => `Отдай ${resource} 3 — пройди 5 клеток вперёд, клетка сработает`,
  },
  [EShopCard.TRAVELATOR]: {
    name: 'Попутка', kind: 'passive', rule: () => 'Остановился на пустой — пройди 4 клетки вперёд, клетка сработает',
  },
  [EShopCard.VOODOO]: {
    name: 'Порча', kind: 'active', rule: resource => `Отдай ${resource} 3 — ближайший впереди в начале своего хода разыгрывает беду`,
  },
};
```

`ECellType.SHOP = 'SHOP'`, `EPhase.SHOP = 'SHOP'`, `EMoveType.BUY_CARD = 'BUY_CARD'` с вариантом `TMove` `{ type: EMoveType.BUY_CARD; playerId; stateId; index: number | null; discardUid?: number }`. `TCardsView = Pick<TCards, 'laws' | 'lawDraw' | 'shopOffer' | 'hands'>`.

- [ ] **Step 2: Падающие тесты**

`core/shop.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { buyCard, openShop } from '@/games/lucid/core/cards';

const { EShopCard } = LucidShared;
const card = (uid: number, kind: LucidShared.EShopCard): LucidShared.THandCard => ({ uid, card: kind });

const withShop = (resource: number, hand: LucidShared.THandCard[] = []): LucidShared.TG => {
  const G = makeG({ players: [{ id: 'a', nickname: 'Аня', position: 0, resource }, { id: 'b', nickname: 'Боря', position: 0, resource: 0 }] });

  return {
    ...G,
    cards: {
      ...G.cards,
      shopDeck: [card(1, EShopCard.ROCKET), card(2, EShopCard.CLOVER), card(3, EShopCard.VOODOO), card(4, EShopCard.HOOK)],
      hands: { a: hand, b: [] },
    },
  };
};

describe('Лавка', () => {
  it('открывает три карты', () => {
    expect(openShop(withShop(10)).cards.shopOffer.map(item => item.uid)).toEqual([1, 2, 3]);
  });

  it('покупка: карта в руку, цена списана, остальные в сброс', () => {
    const bought = buyCard(openShop(withShop(10)), 'a', 1)!;

    expect(bought.cards.hands.a).toEqual([card(2, EShopCard.CLOVER)]);
    expect(bought.players.a.resource).toBe(5);
    expect(bought.cards.shopDiscard.map(item => item.uid)).toEqual([1, 3]);
    expect(bought.cards.shopOffer).toEqual([]);
  });

  it('отказ: всё в сброс, Ресурс цел', () => {
    const skipped = buyCard(openShop(withShop(10)), 'a', null)!;

    expect(skipped.players.a.resource).toBe(10);
    expect(skipped.cards.shopDiscard).toHaveLength(3);
  });

  it('полная рука: без карты на сброс покупка отклоняется', () => {
    const full = [card(7, EShopCard.ROCKET), card(8, EShopCard.ROCKET), card(9, EShopCard.ROCKET)];
    const shop = openShop(withShop(10, full));

    expect(buyCard(shop, 'a', 0)).toBeNull();
    expect(buyCard(shop, 'a', 0, 8)!.cards.hands.a.map(item => item.uid)).toEqual([7, 9, 1]);
  });

  it('не хватает Ресурса — покупка отклоняется', () => {
    expect(buyCard(openShop(withShop(4)), 'a', 0)).toBeNull();
  });
});
```

Ещё тесты:
- `core/cards.test.ts`: `createCards` кладёт в `shopDeck` 20 карт — по две каждого `EShopCard`, `uid` 0…19 без повторов.
- `core/formatForPlayer.test.ts`: `shopDeck` и `shopDiscard` не уходят игроку; руки уходят все (`hands` всех игроков видны).
- `core/autoMove.test.ts`: фаза `SHOP` → `{ type: BUY_CARD, index: null }`.
- `core/reducer.test.ts`: игрок с Ресурсом меньше 5 встаёт на `SHOP` — Лавка не открывается, ход идёт дальше, в ленте «{ник}: в Лавке не по карману».
- `core/lawEffects.test.ts`: «Подарок» — отстающий в начале хода с рукой 2 получает третью карту; с рукой 3 — ничего.

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/shop.test.ts` — Expected: FAIL.

- [ ] **Step 3: Реализация**

`core/cards.ts`:

```ts
const SHOP_COPIES = 2;

export const emptyCards = (): LucidShared.TCards => ({
  laws: Array.from({ length: LAW_SLOTS }, () => null),
  lawDeck: [],
  lawDiscard: [],
  lawDraw: [],
  shopDeck: [],
  shopDiscard: [],
  shopOffer: [],
  hands: {},
});

export const LAW_DECK = Object.values(LucidShared.ELaw);

const SHOP_DECK: LucidShared.THandCard[] = Object.values(LucidShared.EShopCard)
  .flatMap(card => Array.from({ length: SHOP_COPIES }, () => card))
  .map((card, uid) => ({ uid, card }));

export const createCards = (random: LucidShared.TRandomState): LucidShared.TCards => {
  const laws = shuffle(random, LAW_DECK);

  return { ...emptyCards(), lawDeck: laws.value, shopDeck: shuffle(laws.state, SHOP_DECK).value };
};
```

`LAW_DECK` теперь со всеми законами: «Подарок» входит в колоду. Тест задачи 1 «без «Подарка»» заменить: «колода законов — все 15».

`drawShop(G, count)` — та же логика, что `drawLaws`, для `shopDeck`/`shopDiscard`; вынести общий помощник `drawFrom<T>(deck, discard, random, count): { drawn: T[]; deck: T[]; discard: T[]; random }` и перевести `drawLaws` на него.

```ts
export const openShop = (G: LucidShared.TG): LucidShared.TG => {
  const drawn = drawFrom(G.cards.shopDeck, G.cards.shopDiscard, G.random, LucidShared.SHOP_OFFER);

  return {
    ...G,
    random: drawn.random,
    cards: { ...G.cards, shopDeck: drawn.deck, shopDiscard: drawn.discard, shopOffer: drawn.drawn },
  };
};

export const buyCard = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  index: number | null,
  discardUid?: number,
): LucidShared.TG | null => {
  const player = G.players[playerId];
  const hand = G.cards.hands[playerId] ?? [];
  const offer = G.cards.shopOffer;

  if (index === null) {
    return {
      ...G,
      cards: { ...G.cards, shopOffer: [], shopDiscard: [...G.cards.shopDiscard, ...offer] },
      log: [...G.log, `${player.nickname} ничего не берёт в Лавке`],
    };
  }

  const bought = Number.isInteger(index) ? offer[index] : undefined;
  const dropped = hand.find(item => item.uid === discardUid);

  if (!bought || player.resource < LucidShared.SHOP_PRICE || (hand.length >= LucidShared.HAND_LIMIT && !dropped)) {
    return null;
  }

  const kept = dropped ? hand.filter(item => item !== dropped) : hand;
  const lines = [`${player.nickname} покупает «${LucidShared.SHOP_TEXT[bought.card].name}»`];

  if (dropped) {
    lines.push(`${player.nickname} сбрасывает «${LucidShared.SHOP_TEXT[dropped.card].name}»`);
  }

  return {
    ...G,
    players: { ...G.players, [playerId]: { ...player, resource: player.resource - LucidShared.SHOP_PRICE } },
    cards: {
      ...G.cards,
      hands: { ...G.cards.hands, [playerId]: [...kept, bought] },
      shopOffer: [],
      shopDiscard: [...G.cards.shopDiscard, ...offer.filter(item => item !== bought), ...(dropped ? [dropped] : [])],
    },
    log: [...G.log, ...lines],
  };
};

export const giveCard = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TG => {
  const hand = G.cards.hands[playerId] ?? [];

  if (hand.length >= LucidShared.HAND_LIMIT) {
    return G;
  }

  const drawn = drawFrom(G.cards.shopDeck, G.cards.shopDiscard, G.random, 1);

  if (drawn.drawn.length === 0) {
    return G;
  }

  return {
    ...G,
    random: drawn.random,
    cards: {
      ...G.cards,
      shopDeck: drawn.deck,
      shopDiscard: drawn.discard,
      hands: { ...G.cards.hands, [playerId]: [...hand, ...drawn.drawn] },
    },
  };
};
```

`core/turn.ts`, `land`: ветка `SHOP` рядом с `LAW`: если `player.resource < SHOP_PRICE` — строка «{ник}: в Лавке не по карману» и `proceed`; иначе `openShop` и фаза `SHOP`.

`core/reducer.ts`: `PHASE_FOR_MOVE[BUY_CARD] = EPhase.SHOP`; обработчик зовёт `buyCard(state.G, currentPlayer, move.index, move.discardUid)`; `null` → отказ; иначе `proceed`. Индекс `null` разрешён, другое нецелое — отказ.

`core/lawEffects.ts`: закон `LAST_START_FREE_CARD`: `timing: 'START'`, `applies: isLast`, `apply` — `giveCard`; строка ленты «закон «Подарок»: {ник} — берёт карту», только если рука выросла.

`core/cellTypes.ts`: `SHOP_SHARE = 0.1`, клетки `SHOP` — после `LAW`.

`core/autoMove.ts`: фаза `SHOP` → `{ type: BUY_CARD, index: null }`.

`core/formatForPlayer.ts`: `cards: { laws, lawDraw, shopOffer, hands }`.

`core/setup.ts`: `hands` заполнить пустыми массивами по игрокам: `cards: { ...createCards(...), hands: Object.fromEntries(players.map(player => [player.id, []])) }`.

Клиентские истории — добавить `shopOffer: [], hands: {}` в `cards`.

- [ ] **Step 4: Тесты**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS. Старые тесты на сгенерированных треках могут встать на `SHOP` — чинить так же, как в задаче 3.

- [ ] **Step 5: PRD и commit**

PRD: «Словарь» — «Лавка», «Рука», «Карта руки»; «Типы клеток» — `SHOP` 10%; «Числовые параметры» — рука 3, цена 5, применение 3, в Лавке 3 карты, колода Лавки 20 (по две каждой); 5.4 — `BUY_CARD`; 5.5 — колоды не уходят игроку, руки видны всем; подраздел «Законы» — «Подарок»; «Карточный слой (отложен)» — удалить, его заменяют «Законы» и новый подраздел «Лавка и рука».

```bash
git add tools/shared server/src/games/lucid client/src docs/lucid/PRD.md
git commit -m "feat(lucid): Лавка — три карты, одна покупка, рука до трёх"
```

---

### Task 9: Фаза карт и активные карты

**Files:**
- Create: `server/src/games/lucid/core/handCards.ts`
- Modify: `tools/shared/src/games/lucid/types/state.ts`, `types/move.ts`, `types/cards.ts`
- Modify: `core/turn.ts`, `core/reducer.ts`, `core/autoMove.ts`, `core/targets.ts`
- Test: `core/handCards.test.ts`, `core/targets.test.ts`, `core/autoMove.test.ts`, `room/party.integration.test.ts`

**Interfaces:**
- Consumes: `land`, `proceed`, `withTurn` (задача 2); `drawEvent` (задача 4).
- Produces: `EPhase.CARDS`; ходы `PLAY_CARD { uid: number; targetId?: TPlayerId }` и `END_TURN`; `TTurn.used: number[]`; `TPlayer.cursed?: number`; на сервере `nearestAhead(G, actorId): { id: TPlayerId; distance: number } | undefined`, `canPlay(G, actorId, handCard, targetId?): boolean`, `playCard(state, uid, targetId?): TState | null`, `hasPlayable(G, actorId): boolean`.

Правила:
- Фаза `CARDS` — шаг `CARDS` машины хода. Она открывается, только если у игрока есть карта, которую можно сыграть. Иначе ход идёт к `END`.
- Каждая карта руки играется не больше раза за ход (`turn.used`). `freshTurn` ставит `used: []`.
- Активная карта стоит 3 Ресурса за применение и остаётся в руке.
- «Ближайший впереди» — другой игрок с наименьшей глубиной из тех, у кого глубина больше твоей; игроки у сейфа не считаются; ничья — первый по `G.order`. Расстояние — разница глубин (`trackDepths`).
- «Кошка» и «Аркан» требуют расстояние ≤10. «Рывок» и «Кошка» не играются у сейфа.
- «Рывок» и «Кошка» вызывают `land`: клетка срабатывает. После неё ход вернётся в фазу карт (`LANDED → CARDS`).
- «Порча»: `cursed += 1` у цели. В начале хода проклятого игрока, до законов начала хода, он разыгрывает беду (`drawEvent(G, 'bad')`), `cursed -= 1`. Бед в партии нет — строка в ленту, ход идёт дальше.
- «Толчок»: `targetId` обязателен, это другой игрок не у сейфа; сдвиг −4 при любом числе игроков. Отличие от «Обвала» — цель любая, а не ближайший впереди.

- [ ] **Step 1: Типы**

`EPhase.CARDS = 'CARDS'`; `EMoveType.PLAY_CARD`, `EMoveType.END_TURN`; варианты `TMove`: `{ type: PLAY_CARD; playerId; stateId; uid: number; targetId?: TPlayerId }`, `{ type: END_TURN; playerId; stateId }`. `TTurn` + `used: number[]`. `TPlayer` + `cursed?: number`. `freshTurn`, `upgrade.test.ts`, `turn.test.ts` и клиентские истории поправить под `used: []`.

- [ ] **Step 2: Падающие тесты**

`core/handCards.test.ts` — каркас как в `lawEffects.test.ts` (трек из пустых клеток длиной 20, игроки `a` и `b`). Тесты:
- `nearestAhead`: `a` на 2, `b` на 9 → `{ id: 'b', distance: 7 }`; `b` позади — `undefined`; `b` у сейфа — `undefined`.
- «Рывок»: Ресурс 10 → позиция +5, Ресурс 7, `turn.used` содержит uid, фаза после клетки снова `CARDS`, если есть ещё играбельная карта, иначе ход у `b`.
- «Рывок» вторым разом в тот же ход — `playCard` → `null`.
- Ресурс 2 — активная карта не играется (`canPlay` → `false`), фазы `CARDS` нет.
- «Обвал»: `b` впереди на 9 → `b` на 3.
- «Кошка»: `b` на 9, `a` на 2 → `a` на 9; `b` на 15 (расстояние 13) — не играется.
- «Аркан»: `b` на 9 → `b` на 2.
- «Порча»: у `b` `cursed: 1`; в партии есть беда → в начале хода `b` фаза `CHOICE` с этой бедой, `cursed: 0`.
- «Толчок»: трое игроков, цель `c` на 6 → `c` на 2, у `a` Ресурс −3, карта осталась в руке; без `targetId` → `null`; цель — сам игрок → `null`; Ресурс 2 → `null`.
- `END_TURN` в фазе `CARDS` → ход у `b`.

`core/autoMove.test.ts`: фаза `CARDS` → `{ type: END_TURN }`.

`room/party.integration.test.ts` уже гоняет автоигру до победы на 2–6 игроках — он должен остаться зелёным.

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/handCards.test.ts` — Expected: FAIL.

- [ ] **Step 3: Реализация**

`core/targets.ts`:

```ts
export const nearestAhead = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
): { id: LucidShared.TPlayerId; distance: number } | undefined => {
  const depths = LucidShared.trackDepths(G.track);
  const own = depths[G.players[actorId].position] ?? 0;
  const ahead = G.order
    .filter(id => id !== actorId && G.players[id].position !== G.track.finishId)
    .map(id => ({ id, distance: (depths[G.players[id].position] ?? 0) - own }))
    .filter(item => item.distance > 0);

  return ahead.reduce<{ id: LucidShared.TPlayerId; distance: number } | undefined>(
    (best, item) => (!best || item.distance < best.distance ? item : best),
    undefined,
  );
};
```

`core/handCards.ts`:

```ts
import { LucidShared } from '@trgames/shared';

import { nearestAhead } from '@/games/lucid/core/targets';

const { EShopCard } = LucidShared;
const REACH = 10;

const atFinish = (G: LucidShared.TG, id: LucidShared.TPlayerId): boolean =>
  G.players[id].position === G.track.finishId;

const isValidTarget = (G: LucidShared.TG, actorId: LucidShared.TPlayerId, targetId?: LucidShared.TPlayerId): boolean =>
  targetId !== undefined && targetId !== actorId && Boolean(G.players[targetId]) && !atFinish(G, targetId);

export const canPlay = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  item: LucidShared.THandCard,
  targetId?: LucidShared.TPlayerId,
): boolean => {
  const text = LucidShared.SHOP_TEXT[item.card];

  if (text.kind === 'passive' || G.turn.used.includes(item.uid)) {
    return false;
  }

  if (G.players[actorId].resource < LucidShared.CARD_USE_PRICE) {
    return false;
  }

  if (item.card === EShopCard.HAND_OF_FATE) {
    return targetId === undefined
      ? G.order.some(id => isValidTarget(G, actorId, id))
      : isValidTarget(G, actorId, targetId);
  }

  const ahead = nearestAhead(G, actorId);

  switch (item.card) {
    case EShopCard.ROCKET:
      return !atFinish(G, actorId);
    case EShopCard.HOOK:
      return !atFinish(G, actorId) && Boolean(ahead && ahead.distance <= REACH);
    case EShopCard.HARPOON:
      return Boolean(ahead && ahead.distance <= REACH);
    default:
      return Boolean(ahead);
  }
};

export const hasPlayable = (G: LucidShared.TG, actorId: LucidShared.TPlayerId): boolean =>
  (G.cards.hands[actorId] ?? []).some(item => canPlay(G, actorId, item));
```

`playCard(state, uid, targetId)`:
1. Найти карту в руке ходящего; `canPlay(..., targetId)` ложно → `null`.
2. Отметить `turn.used`; списать 3 Ресурса.
3. Применить эффект; строка ленты «{ник} играет «{название}»: {что}».
4. «Рывок», «Кошка» → `land(state)`; иначе → `proceed(state)` (шаг `CARDS` снова проверит `hasPlayable`).

`core/turn.ts`:
- `freshTurn`: `used: []`.
- `proceed`, шаг `CARDS`: `hasPlayable(G, currentPlayer)` → фаза `CARDS`; иначе шаг `END`.
- `startTurn`: до законов начала хода — порча: если `cursed > 0`, уменьшить, вытянуть беду; есть → `eventCellId` и фаза `CHOICE` (шаг остаётся `START`, после выбора `proceed` продолжит законы начала хода); нет → строка «{ник}: порча не нашла беды».

Чтобы не было циклического импорта `turn.ts` ↔ `handCards.ts`: `hasPlayable` и `canPlay` не импортируют `turn.ts`; `playCard` положить в `core/reducer.ts` или в отдельный `core/playCard.ts`, который импортирует и `turn.ts`, и `handCards.ts`.

`core/reducer.ts`: `PHASE_FOR_MOVE[PLAY_CARD] = PHASE_FOR_MOVE[END_TURN] = EPhase.CARDS`; `END_TURN` → `proceed` с шагом `END`.

`core/autoMove.ts`: фаза `CARDS` → `END_TURN`.

- [ ] **Step 4: Тесты**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS.

- [ ] **Step 5: PRD и commit**

PRD: подраздел «Лавка и рука» — фаза карт, правила выше, таблица 6 активных карт; 5.4 — `PLAY_CARD`, `END_TURN`; «Словарь» — «Ближайший впереди — другой игрок с наименьшей глубиной больше твоей, не у сейфа; ничья — первый по очереди».

```bash
git add tools/shared server/src/games/lucid docs/lucid/PRD.md
git commit -m "feat(lucid): фаза карт — активные карты руки после клетки"
```

---

### Task 10: Пассивные карты

**Files:**
- Modify: `server/src/games/lucid/core/lawEffects.ts` (или новый `core/passiveCards.ts`), `core/turn.ts`, `core/moves.ts`
- Test: `core/passiveCards.test.ts`

**Interfaces:**
- Consumes: `runLaws`/`applyPause` (задача 5), `turn.used` (задача 9).
- Produces: `runPassives(G, playerId): { G; pause? }` с тем же типом паузы `TLawPause`; `rollBonus(G, playerId): number`.

Правила:
- «Громоотвод» (красная, +5), «Подкова» (пустая, +4), «Попутка» (пустая, +4 клетки вперёд, клетка сработает) срабатывают на шаге `LANDED` после законов, по порядку карт в руке, каждая карта — раз за ход (`turn.used`). Смотрят на `turn.landedCellId`.
- «Утяжелённый кубик»: +1 к броску на движение за каждую такую карту. Кубик показывает выпавшее число, фишка идёт на число + бонус. При двух кубиках бонус добавляется к выбранному кубику. Строка ленты: «{ник} идёт на {n} (+{бонус} от карт)». Законы «Шестёрка» и «Дубль» смотрят на выпавшие кубики без бонуса.

- [ ] **Step 1: Падающие тесты**

`core/passiveCards.test.ts`:
- «Громоотвод» на красной → +5; на пустой — ничего.
- «Подкова» на пустой → +4; две «Подковы» → +8.
- «Попутка» на пустой → +4 клетки; новая клетка пустая — вторая «Попутка» из той же руки срабатывает на ней, первая — нет (`turn.used`).
- «Утяжелённый кубик»: `rollAndMove` с одним кубиком — `lastRoll.value` равен выпавшему, позиция = выпавшее + 1. С двумя кубиками `pickDie` даёт выбранный + 1.
- Закон «Урожай» и «Громоотвод» на одной зелёной/красной не мешают друг другу: сначала закон, потом карта (по ленте).

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/passiveCards.test.ts` — Expected: FAIL.

- [ ] **Step 2: Реализация**

- `runPassives`: обойти `G.cards.hands[playerId]`, пропустить не пассивные и `turn.used`; совпал тип клетки — добавить uid в `used`, применить; «Попутка» → пауза `{ kind: 'LAND' }`.
- `proceed`, шаг `LANDED`: после `runLaws(..., 'LANDED')` без паузы — `runPassives`; пауза → `applyPause`; иначе шаг `CARDS`.
- `rollBonus = (G, id) => (G.cards.hands[id] ?? []).filter(item => item.card === EShopCard.MAGIC_DIE).length`.
- `core/moves.ts`, `walkWith`: шаги `lastRoll.value + rollBonus(G, playerId)`; строку ленты дополнить « (+{бонус} от карт)» при бонусе > 0.

- [ ] **Step 3: Тесты и commit**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS.

PRD: таблица 4 пассивных карт в «Лавка и рука».

```bash
git add server/src/games/lucid docs/lucid/PRD.md
git commit -m "feat(lucid): пассивные карты руки — клетки и бросок"
```

---

### Task 11: Названия карт от модели

**Files:**
- Modify: `tools/shared/src/games/lucid/types/content.ts`, `types/state.ts`
- Modify: `server/src/games/lucid/generation/schema.ts`, `generation/prompt.ts`, `generation/pipeline.ts`, `core/setup.ts`, `core/formatForPlayer.ts`
- Test: `generation/schema.test.ts`, `generation/prompt.test.ts`, `generation/pipeline.test.ts`, `core/setup.test.ts`

**Interfaces:**
- Produces: `LucidShared.TCardName = { name: string; flavor: string }`; `TPartyContent.cardNames?: Record<string, TCardName>`; `TG.cardNames?: Record<string, TCardName>` (ключ — значение `ELaw` или `EShopCard`); `cardName(G, id): string` в shared — имя от модели или из `LAW_TEXT`/`SHOP_TEXT`.

Правила:
- Модель даёт каждой из 25 карт название (≤30 знаков) и строку настроения (≤70 знаков) в духе мира. Правило карты всегда пишет код.
- Поле `cards` в ответе мира необязательно: кривой или неполный ответ не перегенерирует мир. Неизвестные id отбрасываются, недостающие берут запасное название.
- Запасная партия — запасные названия из `cardText.ts`.

- [ ] **Step 1: Падающие тесты**

- `schema.test.ts`: мир с `cards: [{ id: 'ROCKET', name: 'Паровой рывок', flavor: '...' }]` валиден; без `cards` валиден; `name` длиной 31 — невалиден.
- `prompt.test.ts`: `buildWorldPrompt` перечисляет все 25 id с правилом карты и требует `cards` в формате JSON.
- `pipeline.test.ts`: модель вернула `cards` с id `ROCKET` и `NOPE` → в `content.cardNames` есть `ROCKET`, нет `NOPE`.
- `setup.test.ts`: `content.cardNames` попадает в `G.cardNames`.
- shared: `cardName(G, 'ROCKET')` — имя от модели; без `cardNames` — «Рывок».

Run: `yarn workspace @trgames/server test --run src/games/lucid/generation` — Expected: FAIL.

- [ ] **Step 2: Реализация**

- `schema.ts`: `CARD_NAME_MAX = 30`, `CARD_FLAVOR_MAX = 70`; в `worldSchema` `cards: z.array(z.strictObject({ id: z.string(), name: z.string().min(1).max(CARD_NAME_MAX), flavor: z.string().min(1).max(CARD_FLAVOR_MAX) })).optional()`.
- `prompt.ts`, `buildWorldPrompt`: добавить в JSON-пример `"cards":[{"id":"...","name":"...","flavor":"..."}]` и абзац: «cards — название и строка настроения для каждой карты из списка. id — точно из списка. name — 1–4 слова в духе мира, до 30 знаков. flavor — одна фраза до 70 знаков. Правило карты не пересказывай, оно уже есть.» Список строк `- {id}: {правило}` из `LAW_TEXT` и `SHOP_TEXT`, Ресурс в правиле — слово «ресурс».
- `pipeline.ts`: после разбора мира собрать `cardNames` из `world.cards`, оставить только id из `ELaw` и `EShopCard`; положить в `content.cardNames`.
- `setup.ts`: `cardNames: content.cardNames`. `formatForPlayer.ts`: передать `cardNames`.
- shared `cardText.ts`: `cardName`.

- [ ] **Step 3: Тесты и commit**

Run: `yarn workspace @trgames/server test --run src/games/lucid` — Expected: PASS.

PRD 4.1–4.4: модель называет карты, правило пишет код, `cards` необязательно в схеме.

```bash
git add tools/shared server/src/games/lucid docs/lucid/PRD.md
git commit -m "feat(lucid): модель называет законы и карты Лавки в духе мира"
```

---

### Task 12: Клиент — Лавка, рука, открытая информация

**Files:**
- Modify: `client/src/lib/lucid/cellLook.ts` (+ тест)
- Create: `client/src/routes/games/lucid/PartyPage/components/Hand/index.tsx`
- Modify: `components/Hud/index.tsx`, `components/LawsStrip/index.tsx`, `components/CardPick/index.tsx`
- Modify: `docs/lucid/PRD.md` (6.3, 6.4)

**Interfaces:**
- Consumes: `state.G.cards.shopOffer`, `state.G.cards.hands`, `state.G.cardNames`, `state.G.turn.used`, `LucidShared.cardName`, `SHOP_TEXT`, `SHOP_PRICE`, `CARD_USE_PRICE`, `HAND_LIMIT`; ходы `BUY_CARD`, `PLAY_CARD`, `END_TURN`.

- [ ] **Step 1: Облик клетки Лавки (TDD)**

Тест: `cellLook` для `SHOP` → `{ fill: SHOP_FILL, glyph: '¤' }`, `SHOP_FILL = '#3f7cc4'`. Run — FAIL, реализовать, Run — PASS.

- [ ] **Step 2: Лавка**

Фаза `SHOP`, мой ход: `CardPick` с `title="Лавка: одна карта за {SHOP_PRICE}"`, карты `shopOffer` (название — `cardName`, правило — `SHOP_TEXT[card].rule(resourceName)`, `flavor` курсивом под названием, если есть), `actionLabel: 'Купить'`, `disabled` при Ресурсе меньше цены, `onSkip` → `BUY_CARD { index: null }`, `skipLabel: 'Ничего не беру'`. Рука полна → после выбора карты тот же `CardPick` с `title="Рука полна: что сбросить?"` и картами руки, `onPick` шлёт `BUY_CARD { index, discardUid }`. Чужой ход: текст «{ник} в Лавке».

- [ ] **Step 3: Рука**

`Hand/index.tsx` — ряд карт ходящего себя (`hands[state.you]`) в нижней панели над кнопкой хода. Карта — чип с названием; нажатие раскрывает правило под рядом. В фазе `CARDS` мой ход: у карты, которую можно сыграть, кнопка «Применить · {CARD_USE_PRICE}»; у «Толчка» после нажатия — кнопки с никами других игроков не у сейфа, выбор шлёт `PLAY_CARD { uid, targetId }`. Справа кнопка «Закончить ход» → `END_TURN`. Можно ли сыграть карту — сервер всё равно проверит; клиент блокирует кнопку по тем же простым признакам: карта в `turn.used`, не хватает Ресурса.

- [ ] **Step 4: Список игроков**

В строке игрока в шапке после ника — Ресурс: `· {resource}` и чипы карт руки (первые буквы названия, `title` — название и правило). Проверить ширину на 360px при шести игроках: строка не шире экрана, лишнее обрезается `truncate`.

- [ ] **Step 5: Названия законов**

`LawsStrip` и выбор закона берут название через `cardName(state.G, law)`.

- [ ] **Step 6: Проверка**

Run: `yarn workspace @trgames/client lint` — Expected: PASS.
Две изолированные вкладки, `yarn start:dev`: купить карту, сыграть «Рывок», проверить Ресурс и карты соперника в шапке, полоса законов с названиями мира.

- [ ] **Step 7: PRD и commit**

```bash
git add client/src docs/lucid/PRD.md
git commit -m "feat(lucid): Лавка и рука на экране, Ресурс и карты игроков видны всем"
```

---

### Task 13: Замер части 2 и документы

**Files:**
- Modify: `server/src/games/lucid/reports/balance.ts` (+ тест), `docs/lucid/CHECK.md`, `docs/lucid/PRD.md`, `docs/lucid/OPEN-QUESTIONS.md`, `docs/lucid/CONTEXT.md`

- [ ] **Step 1: Замер**

`measureParties` — добавить столбцы «куплено карт» (строки ленты « покупает »). Автопилот карт не покупает, поэтому для замера длины добавить режим `buyer: true`: в фазе `SHOP` покупать первую доступную карту (сбрасывать первую карту руки при полной руке), в фазе `CARDS` играть первую играбельную карту (цель «Толчка» — первый допустимый игрок). Режим живёт только в `reports/`, автопилот партии не меняется. Тест: с `buyer: true` партия на 2 игроках доходит до победы.

Run: `yarn workspace @trgames/server lucid:balance` — записать обе таблицы (без покупок и с покупками) в `CHECK.md` разделом «Итерация 3: Лавка, замер автоигрой (дата)».

- [ ] **Step 2: Документы**

- `OPEN-QUESTIONS.md`: решения владельца (Лавка: 3 карты, одна покупка, сброс при полной руке; руки и Ресурс видны всем; «Толчок» — многоразовый, 3 Ресурса, выбранный игрок −4; полоса законов над полем, рука в нижней панели; автопроверка после каждой части; названия только наши) — «одобрено 2026-10-03». Решения исполнителя — «ждёт апрува»: при Ресурсе меньше 5 Лавка не открывается; «ближайший впереди» при ничьей — первый по очереди.
- `CONTEXT.md`: «Карта руки», «Лавка» — сверить с реализацией.
- `PRD.md`, раздел 10: итерации 2 и 3 сделаны, дальше — живая партия владельца, затем итерация 4 (схватка, `CHOSEN` в событиях модели).

- [ ] **Step 3: Финальная проверка и commit**

Run: `yarn lint` — Expected: PASS по всем воркспейсам.

```bash
git add server docs/lucid
git commit -m "docs(lucid): итерация 3 — Лавка, замер автоигрой"
```
