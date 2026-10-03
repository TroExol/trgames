# lucid v2, итерация 1 «Поле» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Открытое поле с типами клеток (событие, пустая, красная, зелёная, портал), трек ×1.5, зоны кубиков (1 кубик / 2 на выбор / сумма двух) и экономика ×3 — чтобы ход приходилось считать и планировать.

**Architecture:** Тип клетки раскладывает код внутри `buildTrack` (детерминированно от сида трека), трек уже уходит клиенту целиком — значит типы видны всем без правок границы секретности. Эффект клетки применяется в `afterMove` редьюсера, только при движении своим ходом. Зона кубика — функция глубины клетки (`trackDepths`), общая для сервера и клиента в `@trgames/shared`; выбор кубика — новая фаза `DICE` и ход `CHOOSE_DIE`.

**Tech Stack:** TypeScript, Node + Socket.io (server), React 18 + MobX + SVG (client), Vitest, zod.

**Spec:** `docs/lucid/OPEN-QUESTIONS.md`, раздел «Вторая версия: механики «Большой бродилки»» (пункты 1, 2, 4, 7, итерация 1). Устройство игры — `docs/lucid/PRD.md`. Карта оригинала для глаз — `~/Downloads/Pnp/MapFull.psd`.

## Global Constraints

- Перед работой прочитать `docs/lucid/PRD.md` (разделы 3, 4.3–4.7, 6.4) и корневой `CLAUDE.md`.
- Коммиты и комментарии в коде — на русском; `Co-Authored-By` в коммиты не добавлять.
- Комментарии в коде не добавлять сверх тех, что даны в плане (предпочтение владельца).
- Одинарные кавычки, точки с запятой, 2 пробела, ≤120 символов; 2+ именованных импорта — каждый на своей строке; type-импорты первыми.
- Типы из shared — только через неймспейс `LucidShared` (`import { LucidShared } from '@trgames/shared'`).
- Один тест-файл: `yarn workspace @trgames/server test --run <путь от server/>` / `yarn workspace @trgames/client test --run <путь от client/>` — флаг `--run` обязателен.
- Pre-commit хук гоняет `yarn lint` по всем воркспейсам (~30 с) — коммит падает при красном линте или тестах.
- В одном дереве пишет один агент.
- Числа итерации: трек 75/68/60/53/45 клеток на 2/3/4/5/6 игроков; доли внутренних клеток без порталов — событие 40%, зелёная 15%, красная 15%, остальное пустые; 2 пары порталов; зелёная +3 Ресурса, красная −3; старт Ресурса 10; `RESOURCE` −5…5; `cost` 2…5.

## Review Focus

1. Старая партия из базы (все клетки `EVENT`, без `portal`, `lastRoll` без `values`) — должна доигрываться без падений: `landOnCell` на `EVENT`/неизвестном типе ничего не делает (тест в Task 2).
2. Игрок отвалился в фазе `DICE` — автопилот обязан выбрать кубик, иначе партия встаёт (тест в Task 3).
3. Устаревший или поддельный `CHOOSE_DIE` (`dieIndex` 2, `lastRoll` не `pending`) — ход отклоняется, состояние прежнее (тест в Task 3).
4. Красная клетка при Ресурсе 1 — Ресурс 0, не минус; лента пишет фактическую потерю «−1», а не «−3» (тест в Task 2).
5. Портал на развилке, на её пряди или рядом со стартом/финишем запутал бы игрока — порталы только на прямых клетках с одним выходом; на всех составах и сидах ровно 4 портала парами (тест в Task 1).

---

### Task 1: Типы клеток и длина трека

**Files:**
- Modify: `tools/shared/src/games/lucid/types/track.ts`
- Modify: `tools/shared/src/games/lucid/track.ts`
- Create: `server/src/games/lucid/core/cellTypes.ts`
- Create: `server/src/games/lucid/core/cellTypes.test.ts`
- Modify: `server/src/games/lucid/core/track.ts`
- Modify: `server/src/games/lucid/core/track.test.ts`

**Interfaces:**
- Produces: `LucidShared.ECellType` с `EMPTY | EVENT | FINISH | GREEN | PORTAL | RED | START`; `LucidShared.TPortal = { pair: number; to: number }`; `TCell.portal?: TPortal`; `LucidShared.EDiceZone` (`ONE | PICK | SUM`); `LucidShared.diceZoneForDepth(depth: number, maxDepth: number): EDiceZone`; серверный `assignCellTypes(track: TTrack, random: TRandomState): { track: TTrack; random: TRandomState }`; `cellCountForPlayers(n)` → 75/68/60/53/45.

- [ ] **Step 1: Расширить shared-типы**

`tools/shared/src/games/lucid/types/track.ts` целиком:

```ts
export enum ECellType {
  EMPTY = 'EMPTY',
  EVENT = 'EVENT',
  FINISH = 'FINISH',
  GREEN = 'GREEN',
  PORTAL = 'PORTAL',
  RED = 'RED',
  START = 'START',
}

// Портал ведёт на парную клетку; pair — номер пары, по нему клиент красит обе
export interface TPortal {
  pair: number;
  to: number;
}

export interface TCell {
  id: number;
  type: ECellType;
  // Клетки, куда можно шагнуть дальше. Больше одной — развилка. Всегда больше id
  next: number[];
  portal?: TPortal;
}

export interface TTrack {
  cells: TCell[];
  startId: number;
  finishId: number;
}
```

В конец `tools/shared/src/games/lucid/track.ts`:

```ts
export enum EDiceZone {
  ONE = 'ONE',
  PICK = 'PICK',
  SUM = 'SUM',
}

const DICE_ZONES = [EDiceZone.ONE, EDiceZone.PICK, EDiceZone.SUM];

// Зона кубика — треть пути по глубине: один кубик, два на выбор, сумма двух
export const diceZoneForDepth = (depth: number, maxDepth: number): EDiceZone =>
  regionForDepth(DICE_ZONES, depth, maxDepth) ?? EDiceZone.ONE;
```

- [ ] **Step 2: Написать падающий тест раскладки**

`server/src/games/lucid/core/cellTypes.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { buildTrack } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

const ECellType = LucidShared.ECellType;
const allPlayerCounts = [2, 3, 4, 5, 6];
const someSeeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const countOf = (track: LucidShared.TTrack, type: LucidShared.ECellType): number =>
  track.cells.filter(cell => cell.type === type).length;

describe('assignCellTypes через buildTrack', () => {
  it('старт и финиш сохраняют свои типы', () => {
    const track = buildTrack({ random: createRandom('edges'), playerCount: 3 });

    expect(track.cells[track.startId].type).toBe(ECellType.START);
    expect(track.cells[track.finishId].type).toBe(ECellType.FINISH);
  });

  it('ровно две пары порталов, каждый ведёт на свою пару', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const portals = track.cells.filter(cell => cell.type === ECellType.PORTAL);

      expect(portals).toHaveLength(4);
      portals.forEach(cell => {
        const target = track.cells[cell.portal!.to];

        expect(target.type).toBe(ECellType.PORTAL);
        expect(target.portal).toEqual({ pair: cell.portal!.pair, to: cell.id });
      });
    }));
  });

  it('портал стоит только на прямой клетке: один выход и единственная на своей глубине', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const depths = LucidShared.trackDepths(track);

      track.cells.filter(cell => cell.type === ECellType.PORTAL).forEach(cell => {
        const sameDepth = track.cells.filter(other => depths[other.id] === depths[cell.id]);

        expect(cell.next).toHaveLength(1);
        expect(sameDepth).toHaveLength(1);
      });
    }));
  });

  it('порталы пары разнесены по треку', () => {
    someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount: 6 });
      const depths = LucidShared.trackDepths(track);

      track.cells.filter(cell => cell.type === ECellType.PORTAL).forEach(cell => {
        expect(Math.abs(depths[cell.id] - depths[cell.portal!.to])).toBeGreaterThanOrEqual(5);
      });
    });
  });

  it('доли: событий 40%, зелёных и красных по 15% от внутренних клеток без порталов', () => {
    allPlayerCounts.forEach(playerCount => {
      const track = buildTrack({ random: createRandom('shares'), playerCount });
      const rest = track.cells.length - 2 - 4;

      expect(countOf(track, ECellType.EVENT)).toBe(Math.round(rest * 0.4));
      expect(countOf(track, ECellType.GREEN)).toBe(Math.round(rest * 0.15));
      expect(countOf(track, ECellType.RED)).toBe(Math.round(rest * 0.15));
      expect(countOf(track, ECellType.EMPTY)).toBe(
        rest - Math.round(rest * 0.4) - 2 * Math.round(rest * 0.15),
      );
    });
  });

  it('раскладка воспроизводима от сида', () => {
    const first = buildTrack({ random: createRandom('same'), playerCount: 4 });
    const second = buildTrack({ random: createRandom('same'), playerCount: 4 });

    expect(first).toEqual(second);
  });
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/cellTypes.test.ts`
Expected: FAIL — порталов 0, событий `cells.length - 2`.

- [ ] **Step 4: Реализовать `assignCellTypes`**

`server/src/games/lucid/core/cellTypes.ts`:

```ts
import { LucidShared } from '@trgames/shared';

import {
  randomInt,
  shuffle,
} from '@/games/lucid/core/random';

const EVENT_SHARE = 0.4;
const GREEN_SHARE = 0.15;
const RED_SHARE = 0.15;

interface TAssignResult {
  track: LucidShared.TTrack;
  random: LucidShared.TRandomState;
}

// Порталы — на прямых клетках, по одной из каждой четверти пути: пары
// 1–3 и 2–4 четвертей, так что пара всегда разнесена по треку
const pickPortals = (
  track: LucidShared.TTrack,
  random: LucidShared.TRandomState,
): { portals: Map<number, LucidShared.TPortal>; random: LucidShared.TRandomState } => {
  const depths = LucidShared.trackDepths(track);
  const perDepth = new Map<number, number>();

  Object.values(depths).forEach(depth => perDepth.set(depth, (perDepth.get(depth) ?? 0) + 1));

  const straight = track.cells
    .filter(cell => cell.id !== track.startId && cell.id !== track.finishId)
    .filter(cell => cell.next.length === 1 && perDepth.get(depths[cell.id]) === 1)
    .sort((first, second) => depths[first.id] - depths[second.id]);

  let current = random;
  const picks = [0, 1, 2, 3].map(index => {
    const quarter = straight.slice(
      Math.floor((index * straight.length) / 4),
      Math.floor(((index + 1) * straight.length) / 4),
    );
    const picked = randomInt(current, 0, quarter.length - 1);

    current = picked.state;

    return quarter[picked.value].id;
  });

  const portals = new Map<number, LucidShared.TPortal>([
    [picks[0], { pair: 0, to: picks[2] }],
    [picks[2], { pair: 0, to: picks[0] }],
    [picks[1], { pair: 1, to: picks[3] }],
    [picks[3], { pair: 1, to: picks[1] }],
  ]);

  return { portals, random: current };
};

export const assignCellTypes = (
  track: LucidShared.TTrack,
  random: LucidShared.TRandomState,
): TAssignResult => {
  const { portals, random: afterPortals } = pickPortals(track, random);
  const rest = track.cells
    .map(cell => cell.id)
    .filter(id => id !== track.startId && id !== track.finishId && !portals.has(id));
  const shuffled = shuffle(afterPortals, rest);
  const events = Math.round(rest.length * EVENT_SHARE);
  const greens = events + Math.round(rest.length * GREEN_SHARE);
  const reds = greens + Math.round(rest.length * RED_SHARE);
  const typeById = new Map<number, LucidShared.ECellType>();

  shuffled.value.forEach((id, index) => {
    if (index < events) {
      typeById.set(id, LucidShared.ECellType.EVENT);
    } else if (index < greens) {
      typeById.set(id, LucidShared.ECellType.GREEN);
    } else if (index < reds) {
      typeById.set(id, LucidShared.ECellType.RED);
    } else {
      typeById.set(id, LucidShared.ECellType.EMPTY);
    }
  });

  return {
    track: {
      ...track,
      cells: track.cells.map(cell => {
        const portal = portals.get(cell.id);

        if (portal) {
          return { ...cell, type: LucidShared.ECellType.PORTAL, portal };
        }

        const type = typeById.get(cell.id);

        return type ? { ...cell, type } : cell;
      }),
    },
    random: shuffled.state,
  };
};
```

- [ ] **Step 5: Подключить к `buildTrack` и удлинить трек**

В `server/src/games/lucid/core/track.ts`:
- `cellCountForPlayers` → `return Math.round(90 - Math.min(Math.max(playerCount, 2), 6) * 7.5);` и комментарий над ней не трогать.
- В `addStraight` и `addFork` `addCell(LucidShared.ECellType.EVENT)` → `addCell(LucidShared.ECellType.EMPTY)`.
- Импорт `import { assignCellTypes } from '@/games/lucid/core/cellTypes';`.
- Последняя строка `return { cells, startId: 0, finishId };` → `return assignCellTypes({ cells, startId: 0, finishId }, current).track;`.

- [ ] **Step 6: Поправить `track.test.ts` под новые числа**

В `server/src/games/lucid/core/track.test.ts`:
- `expect(cellCountForPlayers(2)).toBe(50)` → `75`; `expect(cellCountForPlayers(6)).toBe(30)` → `45`; добавить `expect(cellCountForPlayers(3)).toBe(68);` и `expect(cellCountForPlayers(5)).toBe(53);`.
- Тест про `eventCellIds` (около строки 105): `toHaveLength(track.cells.length - 2)` заменить на
  `expect(eventCellIds(track)).toHaveLength(track.cells.filter(cell => cell.type === LucidShared.ECellType.EVENT).length);`
  и импорт `LucidShared` сделать значением (`import { LucidShared } from '@trgames/shared';`), если сейчас он `import type`.

- [ ] **Step 7: Прогнать тесты сервера целиком**

Run: `yarn workspace @trgames/server test`
Expected: `cellTypes.test.ts` и `track.test.ts` PASS. Упасть могут `fallback.test.ts` («48 событий на треке для двоих») — это чинит Task 4, сейчас пометить `it.skip` нельзя; вместо этого в этом же шаге заменить в `fallback.test.ts` проверку `toHaveLength(48)` на `toHaveLength(trackEventCellIds(2).length)`. Остальные падения разобрать и починить: они означают, что тест опирался на «каждая клетка — событие».

- [ ] **Step 8: Коммит**

```bash
git add tools/shared/src/games/lucid server/src/games/lucid
git commit -m "feat(lucid): типы клеток на поле и трек длиннее в полтора раза"
```

---

### Task 2: Эффект клетки при остановке

**Files:**
- Create: `server/src/games/lucid/core/cells.ts`
- Create: `server/src/games/lucid/core/cells.test.ts`
- Modify: `server/src/games/lucid/core/reducer.ts` (`afterMove`)
- Modify: `server/src/games/lucid/core/reducer.test.ts`

**Interfaces:**
- Consumes: `ECellType`, `TCell.portal` из Task 1.
- Produces: `landOnCell(G: TG, playerId: TPlayerId): TG`; константы `GREEN_REWARD = 3`, `RED_PENALTY = 3`.

- [ ] **Step 1: Падающий тест**

`server/src/games/lucid/core/cells.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { landOnCell } from '@/games/lucid/core/cells';

const ECellType = LucidShared.ECellType;

const makeG = (type: LucidShared.ECellType, resource = 10): LucidShared.TG => ({
  players: { p1: { id: 'p1', nickname: 'Ваня', position: 1, resource, skipTurns: 0 } },
  order: ['p1'],
  track: {
    cells: [
      { id: 0, type: ECellType.START, next: [1] },
      {
        id: 1,
        type,
        next: [2],
        portal: type === ECellType.PORTAL ? { pair: 0, to: 3 } : undefined,
      },
      { id: 2, type: ECellType.EMPTY, next: [3] },
      { id: 3, type: ECellType.PORTAL, next: [4], portal: { pair: 0, to: 1 } },
      { id: 4, type: ECellType.FINISH, next: [] },
    ],
    startId: 0,
    finishId: 4,
  },
  events: {},
  theme: { name: 'Мир', resourceName: 'заряды', palette: [] },
  random: { seed: 1 },
  visited: [0, 1],
  log: [],
  branchChoices: [],
  pendingSteps: 0,
  cellHistory: {},
});

describe('landOnCell', () => {
  it('зелёная клетка даёт +3 Ресурса и строку в ленту', () => {
    const G = landOnCell(makeG(ECellType.GREEN), 'p1');

    expect(G.players.p1.resource).toBe(13);
    expect(G.log).toEqual(['Ваня: зелёная клетка, заряды +3']);
  });

  it('красная клетка отнимает 3 Ресурса', () => {
    const G = landOnCell(makeG(ECellType.RED), 'p1');

    expect(G.players.p1.resource).toBe(7);
    expect(G.log).toEqual(['Ваня: красная клетка, заряды −3']);
  });

  it('красная клетка не уводит Ресурс в минус и пишет фактическую потерю', () => {
    const G = landOnCell(makeG(ECellType.RED, 1), 'p1');

    expect(G.players.p1.resource).toBe(0);
    expect(G.log).toEqual(['Ваня: красная клетка, заряды −1']);
  });

  it('портал переносит на парную клетку и отмечает её посещённой', () => {
    const G = landOnCell(makeG(ECellType.PORTAL), 'p1');

    expect(G.players.p1.position).toBe(3);
    expect(G.visited).toContain(3);
    expect(G.log).toEqual(['Ваня проходит портал']);
  });

  it('пустая клетка и клетка события ничего не меняют — старые партии из базы тоже', () => {
    [ECellType.EMPTY, ECellType.EVENT].forEach(type => {
      const before = makeG(type);

      expect(landOnCell(before, 'p1')).toBe(before);
    });
  });
});
```

- [ ] **Step 2: Убедиться, что падает**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/cells.test.ts`
Expected: FAIL — модуль `cells` не найден.

- [ ] **Step 3: Реализация**

`server/src/games/lucid/core/cells.ts`:

```ts
import { LucidShared } from '@trgames/shared';

export const GREEN_REWARD = 3;
export const RED_PENALTY = 3;

const withResource = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, delta: number): LucidShared.TG => {
  const player = G.players[playerId];
  const resource = Math.max(player.resource + delta, 0);
  const actual = resource - player.resource;
  const color = delta > 0 ? 'зелёная' : 'красная';
  const sign = actual >= 0 ? '+' : '−';

  return {
    ...G,
    players: { ...G.players, [playerId]: { ...player, resource } },
    log: [...G.log, `${player.nickname}: ${color} клетка, ${G.theme.resourceName} ${sign}${Math.abs(actual)}`],
  };
};

// Эффект клетки, на которой закончилось движение своим ходом. Событие сюда
// не входит — его разыгрывает редьюсер фазой CHOICE
export const landOnCell = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TG => {
  const player = G.players[playerId];
  const cell = G.track.cells.find(item => item.id === player.position);

  switch (cell?.type) {
    case LucidShared.ECellType.GREEN:
      return withResource(G, playerId, GREEN_REWARD);
    case LucidShared.ECellType.RED:
      return withResource(G, playerId, -RED_PENALTY);
    case LucidShared.ECellType.PORTAL: {
      const to = cell.portal?.to;

      if (to === undefined) {
        return G;
      }

      return {
        ...G,
        players: { ...G.players, [playerId]: { ...player, position: to } },
        visited: G.visited.includes(to) ? G.visited : [...G.visited, to],
        log: [...G.log, `${player.nickname} проходит портал`],
      };
    }
    default:
      return G;
  }
};
```

- [ ] **Step 4: Тест проходит**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/cells.test.ts`
Expected: PASS.

- [ ] **Step 5: Падающий тест редьюсера**

В `server/src/games/lucid/core/reducer.test.ts` добавить `describe('клетка после хода', ...)`. Собрать состояние фабрикой, которой файл уже пользуется (посмотреть начало файла: обычно `makeState`/`straightTrack` из `@/games/lucid/vitest/factories`), заменить в треке тип клетки, на которую детерминированно придёт бросок, на `GREEN`, и проверить: после `ROLL` Ресурс ходившего вырос на 3, фаза `ROLL`, `ctx.currentPlayer` — следующий игрок. Нужное значение броска подобрать перебором сида: в цикле по `createRandom('s' + i)` найти сид, у которого `rollDie(...).value` равен расстоянию до клетки, и положить его в `G.random`. Второй тест: если позиция ходившего после `ROLL` — клетка `EVENT` с событием в `G.events`, фаза `CHOICE`, Ресурс не менялся (это поведение уже есть — тест страхует, что `landOnCell` его не перебил).

- [ ] **Step 6: Подключить в редьюсере**

В `server/src/games/lucid/core/reducer.ts`: импорт `import { landOnCell } from '@/games/lucid/core/cells';`; последнюю строку `afterMove`

```ts
  return { ...state, ctx: nextPlayer(state) };
```

заменить на

```ts
  const landed = { ...state, G: landOnCell(state.G, player.id) };

  return { ...landed, ctx: nextPlayer(landed) };
```

- [ ] **Step 7: Прогон всех тестов сервера**

Run: `yarn workspace @trgames/server test`
Expected: PASS (включая `lucid.integration.test.ts` — партия доходит до победителя на всех сидах).

- [ ] **Step 8: Коммит**

```bash
git add server/src/games/lucid/core
git commit -m "feat(lucid): красные, зелёные клетки и порталы срабатывают при остановке"
```

---

### Task 3: Зоны кубиков на сервере

**Files:**
- Modify: `tools/shared/src/games/lucid/types/state.ts` (`EPhase`, `TRoll`)
- Modify: `tools/shared/src/games/lucid/types/move.ts`
- Modify: `server/src/games/lucid/core/moves.ts`
- Modify: `server/src/games/lucid/core/moves.test.ts`
- Modify: `server/src/games/lucid/core/reducer.ts`
- Modify: `server/src/games/lucid/core/reducer.test.ts`
- Modify: `server/src/games/lucid/core/autoMove.ts`
- Modify: `server/src/games/lucid/core/autoMove.test.ts`

**Interfaces:**
- Consumes: `LucidShared.diceZoneForDepth`, `LucidShared.EDiceZone`, `LucidShared.trackDepths` (Task 1).
- Produces: `EPhase.DICE`; `EMoveType.CHOOSE_DIE` с полем `dieIndex: number`; `TRoll.values?: number[]`, `TRoll.pending?: boolean`, `TRoll.picked?: number`; серверный `pickDie(G, playerId, dieIndex): TG | null`. Семантика `TRoll.value` — сколько шагов пройдено (для `pending` — первый кубик, шагов ещё нет).

- [ ] **Step 1: Shared-типы**

В `tools/shared/src/games/lucid/types/state.ts`:
- `EPhase` дополнить `DICE = 'DICE',` (по алфавиту — между `CHOICE` и `ENDED`).
- В `TRoll` после `threshold?: number;` добавить:

```ts
  // Все кубики броска, если их было два
  values?: number[];
  // Два кубика на выбор: фишка ещё не двигалась, ждём CHOOSE_DIE
  pending?: boolean;
  // Индекс выбранного кубика в values
  picked?: number;
```

В `tools/shared/src/games/lucid/types/move.ts` `EMoveType` дополнить `CHOOSE_DIE = 'CHOOSE_DIE',` и в `TMove` добавить ветку
`| { type: EMoveType.CHOOSE_DIE; playerId: TPlayerId; stateId: number; dieIndex: number }`.

- [ ] **Step 2: Падающие тесты движения**

В `server/src/games/lucid/core/moves.test.ts` добавить `describe('зоны кубиков', ...)`. Трек — прямой из 31 клетки, собрать прямо в тесте:

```ts
const straight = (length: number): LucidShared.TTrack => ({
  cells: Array.from({ length }, (_, id) => ({
    id,
    type: id === 0
      ? LucidShared.ECellType.START
      : id === length - 1 ? LucidShared.ECellType.FINISH : LucidShared.ECellType.EMPTY,
    next: id === length - 1 ? [] : [id + 1],
  })),
  startId: 0,
  finishId: length - 1,
});
```

Глубина финиша 30 → зоны: 0–9 `ONE`, 10–20 `PICK`, 21–30 `SUM` (проверить вызовом `diceZoneForDepth` в самом тесте, не хардкодить). Тесты:
1. Игрок на клетке 0 — `rollAndMove` двигает на `lastRoll.value`, `values` нет.
2. Игрок на клетке 15 — позиция не меняется, `lastRoll.pending === true`, `lastRoll.values` длины 2, оба 1…6.
3. Игрок на клетке 22 — позиция `22 + values[0] + values[1]` (не дальше финиша), `lastRoll.value` равен сумме.
4. После п. 2 `pickDie(G, id, 1)` двигает на `values[1]`, `lastRoll` — новый объект с `picked: 1`, без `pending`.
5. `pickDie` с `dieIndex: 2` или когда `lastRoll.pending` не `true` — возвращает `null`.

- [ ] **Step 3: Убедиться, что падают**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/moves.test.ts`
Expected: FAIL — `pickDie` не экспортирован, на клетке 15 фишка двигается.

- [ ] **Step 4: Реализация в `moves.ts`**

`rollAndMove` заменить, `pickDie` добавить (импорты: `import { LucidShared } from '@trgames/shared';` — значением, т.к. нужны функции; `TWalkResult` остаётся type-импортом):

```ts
const walkWith = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  lastRoll: LucidShared.TRoll,
  line: string,
): LucidShared.TG => {
  const moved = applyWalk(
    { ...G, lastRoll },
    playerId,
    walkForward(G.track, G.players[playerId].position, lastRoll.value),
  );

  return { ...moved, log: [...moved.log, line] };
};

export const rollAndMove = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
): LucidShared.TG => {
  const player = G.players[playerId];
  const depths = LucidShared.trackDepths(G.track);
  const zone = LucidShared.diceZoneForDepth(depths[player.position] ?? 0, depths[G.track.finishId] ?? 0);
  const first = rollDie(G.random);

  if (zone === LucidShared.EDiceZone.ONE) {
    return walkWith(
      { ...G, random: first.state },
      playerId,
      { playerId, value: first.value },
      `${player.nickname} выбрасывает ${first.value}`,
    );
  }

  const second = rollDie(first.state);
  const values = [first.value, second.value];

  if (zone === LucidShared.EDiceZone.PICK) {
    return {
      ...G,
      random: second.state,
      lastRoll: { playerId, value: first.value, values, pending: true },
      log: [...G.log, `${player.nickname} выбрасывает ${first.value} и ${second.value}`],
    };
  }

  const sum = first.value + second.value;

  return walkWith(
    { ...G, random: second.state },
    playerId,
    { playerId, value: sum, values },
    `${player.nickname} выбрасывает ${first.value} + ${second.value} = ${sum}`,
  );
};

// null — выбирать нечего: бросок не ждёт выбора или такого кубика нет
export const pickDie = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  dieIndex: number,
): LucidShared.TG | null => {
  const roll = G.lastRoll;
  const value = roll?.pending ? roll.values?.[dieIndex] : undefined;

  if (!roll || value === undefined) {
    return null;
  }

  return walkWith(
    G,
    playerId,
    { playerId, value, values: roll.values, picked: dieIndex },
    `${G.players[playerId].nickname} идёт на ${value}`,
  );
};
```

- [ ] **Step 5: Тесты движения проходят**

Run: `yarn workspace @trgames/server test --run src/games/lucid/core/moves.test.ts`
Expected: PASS.

- [ ] **Step 6: Падающие тесты редьюсера и автопилота**

`reducer.test.ts`, новый `describe('выбор кубика')` на треке `straight(31)` из Step 2 (скопировать хелпер), игрок на клетке 15:
1. `ROLL` → фаза `DICE`, `currentPlayer` тот же, позиция прежняя.
2. Затем `CHOOSE_DIE` с `dieIndex: 0` и актуальным `stateId` → позиция `15 + values[0]`, фаза `ROLL`, ход у следующего игрока.
3. `CHOOSE_DIE` с `dieIndex: 2` → состояние возвращается тем же объектом (`toBe`).
4. `CHOOSE_DIE` в фазе `ROLL` → тем же объектом.

`autoMove.test.ts`: в фазе `DICE` `chooseAutoMove` возвращает `{ type: CHOOSE_DIE, dieIndex: 0, playerId, stateId }`.

- [ ] **Step 7: Реализация в редьюсере и автопилоте**

`reducer.ts`:
- Импорт `import { pickDie, rollAndMove, takeBranch } from '@/games/lucid/core/moves';` (каждый на своей строке — 3 имени).
- `PHASE_FOR_MOVE` дополнить `[EMoveType.CHOOSE_DIE]: LucidShared.EPhase.DICE,`.
- В обработчике `ROLL` последнюю строку заменить на:

```ts
    const rolled = { ...state, G: rollAndMove(state.G, player.id) };

    if (rolled.G.lastRoll?.pending) {
      return { ...rolled, ctx: { ...rolled.ctx, phase: LucidShared.EPhase.DICE } };
    }

    return afterMove(rolled);
```

- Новый обработчик в `HANDLERS`:

```ts
  [EMoveType.CHOOSE_DIE]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_DIE) {
      return null;
    }

    const G = pickDie(state.G, state.ctx.currentPlayer, move.dieIndex);

    return G ? afterMove({ ...state, G }) : null;
  },
```

`autoMove.ts`, перед блоком `CHOICE`:

```ts
  if (state.ctx.phase === LucidShared.EPhase.DICE) {
    return { type: LucidShared.EMoveType.CHOOSE_DIE, playerId, stateId, dieIndex: 0 };
  }
```

Комментарий над `chooseAutoMove` дополнить словами «первый кубик на выбор,» после «кубик,».

- [ ] **Step 8: Прогон всего сервера и типов**

Run: `yarn workspace @trgames/server test` и `yarn workspace @trgames/server lint`
Expected: PASS. `lucid.integration.test.ts` доходит до победителя на всех сидах (автопилот проходит фазу `DICE`). Если `typecheck` ругается на неисчерпывающий `switch`/`Record` по `EMoveType`/`EPhase` в других местах сервера — дописать ветку `CHOOSE_DIE`/`DICE` по смыслу соседних.

- [ ] **Step 9: Коммит**

```bash
git add tools/shared/src/games/lucid server/src/games/lucid
git commit -m "feat(lucid): зоны кубиков — один, два на выбор, сумма двух"
```

---

### Task 4: Экономика ×3

**Files:**
- Modify: `server/src/games/lucid/core/setup.ts:6`
- Modify: `server/src/games/lucid/generation/schema.ts` (`ATOM_RANGES`, `COST_RANGE`)
- Modify: `server/src/games/lucid/generation/prompt.ts`
- Modify: `server/src/games/lucid/generation/fallbackContent.json`
- Modify: `server/src/games/lucid/generation/fallback.test.ts`
- Modify: тесты, которые упадут на старых числах (`setup.test.ts`, `schema.test.ts`, `prompt.test.ts` — по факту прогона)

**Interfaces:**
- Produces: `START_RESOURCE = 10`; `ATOM_RANGES.RESOURCE = { min: -5, max: 5 }`; `COST_RANGE = { min: 2, max: 5 }`.

- [ ] **Step 1: Числа в коде**

- `setup.ts`: `const START_RESOURCE = 3;` → `10`.
- `schema.ts`: `[LucidShared.EAtomKind.RESOURCE]: { min: -3, max: 3 }` → `{ min: -5, max: 5 }`; `COST_RANGE = { min: 1, max: 3 }` → `{ min: 2, max: 5 }`.

- [ ] **Step 2: Промпт**

В `generation/prompt.ts` (раздел «Правила баланса вариантов» и пример JSON):
- «платный даёт примерно на единицу больше, чем стоит» → «платный даёт примерно на 1–2 больше, чем стоит»;
- «от −1 до −3 клеток, или −1…−2 ресурса, или пропуск хода» → «от −1 до −3 клеток, или −2…−4 ресурса, или пропуск хода»;
- строка 51 (константа с «−2 клетки, −2 ресурса») — «−2 ресурса» → «−4 ресурса»;
- в примере JSON: `"cost":2` → `"cost":3`; `{"kind":"RESOURCE","target":"SELF","value":2}` → `"value":4`.

Диапазоны `threshold`/`cost`/атомов в промпт подставляются из `schema.ts` сами — их не трогать.

- [ ] **Step 3: Пересчитать запасной пул**

Run из корня репо:

```bash
python3 - <<'EOF'
import json
p = 'server/src/games/lucid/generation/fallbackContent.json'
data = json.load(open(p, encoding='utf-8'))
clamp = lambda v, lo, hi: max(lo, min(hi, v))
def atoms(items):
    for atom in items or []:
        if atom['kind'] == 'RESOURCE':
            atom['value'] = clamp(atom['value'] * 2, -5, 5)
def effect(e):
    if not e:
        return
    atoms(e.get('atoms'))
    atoms(e.get('otherwise'))
    c = e.get('condition')
    if c and c['field'] == 'RESOURCE':
        c['value'] = min(c['value'] * 2, 20)
for event in data['events']:
    for option in event['options']:
        if 'cost' in option:
            option['cost'] = clamp(option['cost'] * 2, 2, 5)
        effect(option.get('success'))
        effect(option.get('failure'))
json.dump(data, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(p, 'a', encoding='utf-8').write('\n')
EOF
git diff --stat server/src/games/lucid/generation/fallbackContent.json
```

Expected: меняются только числа. Если `git diff` показывает перестройку отступов всего файла — исходный отступ был другим: повторить с тем `indent`, что в исходнике (`git show HEAD:server/src/games/lucid/generation/fallbackContent.json | head -5`).

- [ ] **Step 4: Тесты запасного пула — на весь пул, а не на раскладку**

Трек для двоих теперь берёт ~29 событий из 48, и доли на подмножестве плавают. В `fallback.test.ts`:
- добавить `const WHOLE_POOL = Array.from({ length: 48 }, (_, index) => index + 1);`;
- тесты «каждое событие пула проходит валидацию», «тексты пула короткие», «пул держит целевые доли» строить на `loadFallbackContent(WHOLE_POOL, 'fallback')`, а проверку длины — `toHaveLength(48)` на нём же;
- тест «события покрывают ровно переданные клетки» оставить на `trackEventCellIds(6)` и `trackEventCellIds(2)`.

- [ ] **Step 5: Прогон и починка чисел в тестах**

Run: `yarn workspace @trgames/server test`
Expected: падения только там, где тест зашил старые числа (стартовый Ресурс 3, `cost` 1, `RESOURCE` ±3, строки промпта). Поправить ожидания на новые значения — логику тестов не менять.

- [ ] **Step 6: Коммит**

```bash
git add server/src/games/lucid
git commit -m "feat(lucid): экономика втрое крупнее — старт 10, цены 2–5"
```

---

### Task 5: Типы клеток и зоны на поле (клиент)

**Files:**
- Modify: `client/src/routes/games/lucid/PartyPage/components/Board/index.tsx`
- Modify: `client/src/routes/games/lucid/PartyPage/components/Board/Board.stories.tsx`
- Create: `client/src/lib/lucid/cellLook.ts`
- Create: `client/src/lib/lucid/cellLook.test.ts`

**Interfaces:**
- Consumes: `ECellType`, `TCell.portal`, `EDiceZone`, `diceZoneForDepth`, `trackDepths` (Task 1).
- Produces: `cellLook(cell: TCell, isVisited: boolean): { fill: 'hollow' | 'ink' | string; glyph?: string; ring?: string }`; `zoneStarts(track: TTrack): { cellId: number; zone: EDiceZone }[]`; `ZONE_LABEL: Record<EDiceZone, string>`.

- [ ] **Step 1: Падающий тест чистых функций**

`client/src/lib/lucid/cellLook.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  cellLook,
  zoneStarts,
} from './cellLook';

const ECellType = LucidShared.ECellType;

describe('cellLook', () => {
  it('нераскрытое событие — полая плитка со знаком вопроса', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, false)).toEqual({ fill: 'hollow', glyph: '?' });
  });

  it('посещённое событие — залитая плитка без знака', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, true)).toEqual({ fill: 'ink' });
  });

  it('красная и зелёная — свой цвет независимо от посещения', () => {
    [false, true].forEach(isVisited => {
      expect(cellLook({ id: 1, type: ECellType.RED, next: [] }, isVisited).fill).toMatch(/^#/);
      expect(cellLook({ id: 1, type: ECellType.GREEN, next: [] }, isVisited).fill).toMatch(/^#/);
    });
  });

  it('портал — кольцо цвета своей пары, у пар разные цвета', () => {
    const first = cellLook({ id: 1, type: ECellType.PORTAL, next: [], portal: { pair: 0, to: 5 } }, false);
    const second = cellLook({ id: 2, type: ECellType.PORTAL, next: [], portal: { pair: 1, to: 6 } }, false);

    expect(first.ring).toBeDefined();
    expect(first.ring).not.toBe(second.ring);
  });
});

describe('zoneStarts', () => {
  it('отмечает первую клетку зон «выбор» и «сумма»', () => {
    const cells = Array.from({ length: 31 }, (_, id) => ({
      id,
      type: ECellType.EMPTY,
      next: id === 30 ? [] : [id + 1],
    }));
    const track = { cells, startId: 0, finishId: 30 };
    const starts = zoneStarts(track);

    expect(starts.map(start => start.zone)).toEqual([LucidShared.EDiceZone.PICK, LucidShared.EDiceZone.SUM]);
    starts.forEach(start => {
      expect(LucidShared.diceZoneForDepth(start.cellId - 1, 30)).not.toBe(start.zone);
      expect(LucidShared.diceZoneForDepth(start.cellId, 30)).toBe(start.zone);
    });
  });
});
```

- [ ] **Step 2: Убедиться, что падает**

Run: `yarn workspace @trgames/client test --run src/lib/lucid/cellLook.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализация**

`client/src/lib/lucid/cellLook.ts`:

```ts
import { LucidShared } from '@trgames/shared';

const RED_FILL = '#c8553d';
const GREEN_FILL = '#5a9e4b';
const PORTAL_RINGS = ['#8e5bd0', '#2f8fd8'];

export const ZONE_LABEL: Record<LucidShared.EDiceZone, string> = {
  [LucidShared.EDiceZone.ONE]: '1 кубик',
  [LucidShared.EDiceZone.PICK]: '2 кубика · выбор',
  [LucidShared.EDiceZone.SUM]: '2 кубика · сумма',
};

export interface TCellLook {
  fill: string;
  glyph?: string;
  ring?: string;
}

export const cellLook = (cell: LucidShared.TCell, isVisited: boolean): TCellLook => {
  switch (cell.type) {
    case LucidShared.ECellType.RED:
      return { fill: RED_FILL };
    case LucidShared.ECellType.GREEN:
      return { fill: GREEN_FILL };
    case LucidShared.ECellType.PORTAL:
      return { fill: 'hollow', ring: PORTAL_RINGS[(cell.portal?.pair ?? 0) % PORTAL_RINGS.length] };
    case LucidShared.ECellType.EVENT:
      return isVisited ? { fill: 'ink' } : { fill: 'hollow', glyph: '?' };
    default:
      return { fill: isVisited ? 'ink' : 'hollow' };
  }
};

export const zoneStarts = (track: LucidShared.TTrack): { cellId: number; zone: LucidShared.EDiceZone }[] => {
  const depths = LucidShared.trackDepths(track);
  const maxDepth = depths[track.finishId] ?? 0;
  const firstByZone = new Map<LucidShared.EDiceZone, { cellId: number; depth: number }>();

  track.cells.forEach(cell => {
    const depth = depths[cell.id] ?? 0;
    const zone = LucidShared.diceZoneForDepth(depth, maxDepth);
    const known = firstByZone.get(zone);

    if (zone !== LucidShared.EDiceZone.ONE && (!known || depth < known.depth)) {
      firstByZone.set(zone, { cellId: cell.id, depth });
    }
  });

  return [LucidShared.EDiceZone.PICK, LucidShared.EDiceZone.SUM].flatMap(zone => {
    const first = firstByZone.get(zone);

    return first ? [{ cellId: first.cellId, zone }] : [];
  });
};
```

- [ ] **Step 4: Тест проходит**

Run: `yarn workspace @trgames/client test --run src/lib/lucid/cellLook.test.ts`
Expected: PASS.

- [ ] **Step 5: Рисовать на поле**

`Board/index.tsx`, цикл `layout.cells.forEach` (около строки 139): ключ группы и заливку брать из `cellLook`. Найти исходную клетку трека по id (`track.cells` уже в области видимости как `track`; построить `const cellById = new Map(track.cells.map(cell => [cell.id, cell]));` перед циклом). Внутри цикла:

```ts
    const look = cellLook(cellById.get(cell.id)!, isVisited);
    const fill = look.fill === 'ink'
      ? ink
      : look.fill === 'hollow' ? region?.hollow ?? 'var(--lucid-base)' : look.fill;
    const key = `${ink}:${fill}:${look.fill === 'ink'}`;
```

и в `tiles.set` — `fill`, `isVisited: look.fill === 'ink'` (прозрачность `TILE_FILL_VISITED` остаётся только у залитых посещённых). Старт и финиш (`isEdge`) рисуются как раньше — для них `cellLook` даёт `default`-ветку.

Собрать отдельные списки для оверлеев после плиток (в том же цикле, `push` в массивы `glyphs`/`rings` по `cell.x/cell.y` из раскладки) и отрисовать их сразу после `{Array.from(tiles).map(...)}`:

```tsx
              {rings.map(ring => (
                <circle
                  cx={ring.x}
                  cy={ring.y}
                  fill="none"
                  key={`ring-${ring.id}`}
                  r={TILE_ACROSS / 2 - 3}
                  stroke={ring.color}
                  strokeWidth={4}
                />
              ))}

              {glyphs.map(glyph => (
                <text
                  className="font-golos"
                  dominantBaseline="central"
                  fill={glyph.ink}
                  fontSize={textSize}
                  key={`glyph-${glyph.id}`}
                  pointerEvents="none"
                  textAnchor="middle"
                  x={glyph.x}
                  y={glyph.y}
                >
                  {glyph.text}
                </text>
              ))}

              {zoneStarts(track).map(start => {
                const cell = layout.byId[start.cellId];

                return cell ? (
                  <text
                    className="font-golos"
                    dominantBaseline="hanging"
                    fill="var(--lucid-text)"
                    fontSize={textSize * 0.85}
                    key={`zone-${start.zone}`}
                    paintOrder="stroke"
                    pointerEvents="none"
                    stroke="var(--lucid-base)"
                    strokeWidth={4}
                    textAnchor="middle"
                    x={cell.x}
                    y={cell.y + TILE_ACROSS / 2 + 4}
                  >
                    {ZONE_LABEL[start.zone]}
                  </text>
                ) : null;
              })}
```

Импорты: `cellLook`, `zoneStarts`, `ZONE_LABEL` из `@/lib/lucid/cellLook` (три имени — каждое на своей строке).

- [ ] **Step 6: История в Storybook**

В `Board.stories.tsx` локальный `buildTrack(straights)` создаёт все клетки `EVENT`. Добавить историю `CellTypes`: взять `buildTrack([7, 7, 6, 6, 6])`, затем `cells.map` — каждой внутренней клетке тип по `id % 4` из `[EVENT, EMPTY, GREEN, RED]`, а клеткам 3↔20 и 9↔28 (или ближайшим прямым по факту раскладки истории) — `PORTAL` с `portal: { pair: 0|1, to }`. `visited` — `[0, 1, 2, 3, 4, 5]`. Остальные поля состояния — как у соседней истории с длинным треком.

- [ ] **Step 7: Проверка**

Run: `yarn workspace @trgames/client lint` и `yarn workspace @trgames/client test`
Expected: PASS. Затем `yarn workspace @trgames/client storybook`, открыть историю `CellTypes` на ширине 360 и 1280: видны красные/зелёные плитки, кольца порталов двух цветов, «?» на нераскрытых событиях, подписи «2 кубика · выбор/сумма» не перекрывают ник и подпись края. Скриншот — в отчёт.

- [ ] **Step 8: Коммит**

```bash
git add client/src
git commit -m "feat(lucid): поле показывает типы клеток, порталы и зоны кубиков"
```

---

### Task 6: Два кубика и выбор (клиент)

**Files:**
- Modify: `client/src/routes/games/lucid/PartyPage/stores/rollReveal.ts`
- Modify: `client/src/routes/games/lucid/PartyPage/stores/rollReveal.test.ts`
- Modify: `client/src/routes/games/lucid/PartyPage/stores/PartyStore.ts` (`reveal`, `finishReveal`)
- Modify: `client/src/routes/games/lucid/PartyPage/components/Hud/components/Die/index.tsx`
- Modify: `client/src/routes/games/lucid/PartyPage/components/Hud/index.tsx`
- Modify: `client/src/routes/games/lucid/PartyPage/components/Hud/Hud.stories.tsx`

**Interfaces:**
- Consumes: `EPhase.DICE`, `EMoveType.CHOOSE_DIE` (`dieIndex`), `TRoll.values/pending/picked` (Task 3); `ZONE_LABEL` (Task 5).
- Produces: `revealPlan(roll: TRoll): { spin: boolean; walk: boolean }`.

- [ ] **Step 1: Падающий тест плана показа**

В `rollReveal.test.ts` добавить:

```ts
describe('revealPlan', () => {
  it('обычный бросок хода: крутим и идём', () => {
    expect(revealPlan({ playerId: 'p', value: 4 })).toEqual({ spin: true, walk: true });
  });

  it('порог варианта: крутим, не идём', () => {
    expect(revealPlan({ playerId: 'p', value: 4, threshold: 3 })).toEqual({ spin: true, walk: false });
  });

  it('два кубика на выбор: крутим, фишка ждёт выбора', () => {
    expect(revealPlan({ playerId: 'p', value: 2, values: [2, 5], pending: true })).toEqual({ spin: true, walk: false });
  });

  it('выбранный кубик: не крутим заново, сразу идём', () => {
    expect(revealPlan({ playerId: 'p', value: 5, values: [2, 5], picked: 1 })).toEqual({ spin: false, walk: true });
  });
});
```

(импорт `revealPlan` рядом с `isNewRoll`).

- [ ] **Step 2: Убедиться, что падает**

Run: `yarn workspace @trgames/client test --run src/routes/games/lucid/PartyPage/stores/rollReveal.test.ts`
Expected: FAIL — `revealPlan` не экспортирован.

- [ ] **Step 3: Реализация `revealPlan`**

В `rollReveal.ts`:

```ts
export const revealPlan = (roll: LucidShared.TRoll): { spin: boolean; walk: boolean } => ({
  spin: roll.picked === undefined,
  walk: roll.threshold === undefined && !roll.pending,
});
```

- [ ] **Step 4: Подключить в `PartyStore`**

- В `reveal()` сразу после `const reduced = prefersReducedMotion();`:

```ts
    if (!revealPlan(roll).spin) {
      this.finishReveal(previous, incoming, roll, reduced);

      return;
    }
```

- В `finishReveal()` условие пути `!reduced && roll.threshold === undefined && previous.state && from !== undefined` → `!reduced && revealPlan(roll).walk && previous.state && from !== undefined`.
- Импорт `revealPlan` рядом с `isNewRoll`.

- [ ] **Step 5: Два кубика в `Die`**

Вынести отрисовку одной грани в локальный компонент `Face({ value, dimmed })` внутри того же файла (SVG `rect` + точки, как сейчас). `Die` рендерит:
- при `spinning` и `roll?.values?.length === 2` (или `pendingRoll` из стора с `values`) — две грани с `spinFace` и `(spinFace % 6) + 1`;
- без `spinning` и с `roll?.values` — две грани `values[0]`, `values[1]`; если `roll.picked !== undefined`, невыбранная с `dimmed` (opacity 0.35);
- иначе — одна грань, как сейчас.
`<title>`: для двух — `Выпало ${a} и ${b}`. Цифра рядом с гранью (если она есть в текущей разметке) для двух кубиков — сумма, если `picked` нет и `pending` нет, иначе `roll.value`.

- [ ] **Step 6: Кнопки выбора кубика и подпись броска в `Hud`**

В `Hud/index.tsx`:
- Обработчик:

```ts
  const handleChooseDie = (dieIndex: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      dieIndex,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.CHOOSE_DIE,
    });
  };
```

- В `renderAction` перед `if (!isMyTurn) { return ... 'Ходит' }` блок:

```tsx
    if (state.ctx.phase === EPhase.DICE) {
      const values = state.G.lastRoll?.values ?? [];

      if (!isMyTurn) {
        return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`${current.nickname} выбирает кубик`}</p>;
      }

      return (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Button
              className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
              disabled={isSent || isRevealing}
              key={index}
              onClick={() => handleChooseDie(index)}
              size="sm"
              style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
              variant="outline"
            >
              {`Идти на ${value}`}
            </Button>
          ))}
        </div>
      );
    }
```

- Подпись кнопки броска: посчитать зону ходящего —

```ts
  const depths = useMemo(() => LucidShared.trackDepths(state.G.track), [state.G.track]);
  const zone = LucidShared.diceZoneForDepth(depths[current.position] ?? 0, depths[state.G.track.finishId] ?? 0);
```

(хуки — до любых ранних `return` компонента; если в компоненте ранний `return` стоит выше места, где известен `state`, считать внутри `renderAction` без `useMemo`). Текст кнопки `Бросить кубик` → `zone === EDiceZone.ONE ? 'Бросить кубик' : \`Бросить: ${ZONE_LABEL[zone]}\``.

- [ ] **Step 7: История Hud**

В `Hud.stories.tsx` добавить историю `PickDie`: состояние как у истории на двоих, `ctx.phase: DICE`, `currentPlayer` — `you`, `G.lastRoll: { playerId: you, value: 2, values: [2, 5], pending: true, stateId: 1 }`.

- [ ] **Step 8: Проверка**

Run: `yarn workspace @trgames/client lint` и `yarn workspace @trgames/client test`
Expected: PASS. Storybook: история `PickDie` — две грани 2 и 5, две кнопки «Идти на 2»/«Идти на 5», ширина 360 без переполнения. Скриншот — в отчёт.

- [ ] **Step 9: Коммит**

```bash
git add client/src
git commit -m "feat(lucid): два кубика на выбор и сумма в интерфейсе хода"
```

---

### Task 7: Документы и живая проверка

**Files:**
- Modify: `docs/lucid/PRD.md`
- Modify: `docs/lucid/OPEN-QUESTIONS.md`
- Modify: `docs/lucid/CHECK.md`

- [ ] **Step 1: Живая партия**

`yarn start:dev`, в двух окнах (второе — инкогнито) создать партию, сыграть до конца. Проверить: видны типы клеток и зоны; зелёная/красная двигают Ресурс и пишут строку в ленту; портал переносит; в средней трети — две кнопки «Идти на N», фишка идёт пошагово на выбранное; в последней трети — сумма; консоль браузера и лог сервера без ошибок. Засечь длительность партии и число ходов. Итог — новым разделом `## Проверка 2026-10-XX` в `docs/lucid/CHECK.md`.

- [ ] **Step 2: PRD**

`docs/lucid/PRD.md`:
- Раздел 3: новые подразделы «Типы клеток» (таблица: тип → что делает → доля; порталы — 2 пары по четвертям, переход не активирует клетку назначения) и «Зоны кубиков» (трети пути по глубине, фаза `DICE`, ход `CHOOSE_DIE`, автопилот берёт первый кубик); в «Событие открывается только движением…» — дописать, что то же правило у красной/зелёной/портала (`core/cells.ts`).
- Таблица «Числовые параметры»: длина трека `round(90 − N×7.5)` (75…45), стартовый Ресурс 10, `cost` 2–5, `RESOURCE` −5…5, зелёная +3 / красная −3.
- 4.3–4.4: новые диапазоны; 4.7: пул по-прежнему 48, на треке для двоих событий ~29, тесты долей — на весь пул.
- 5.4: ход `CHOOSE_DIE` в таблице протокола; 6.3/6.4: `cellLook`, оверлеи, подписи зон, две грани `Die`, `revealPlan`.
- 6.11/7: новые файлы тестов и их число по факту прогона.
- 10 «В работе»: итерация 1 сделана, дальше — живая партия владельца, затем итерация 2 («Тадам»).

- [ ] **Step 3: OPEN-QUESTIONS — решения, принятые по ходу (ждут апрува)**

Новые разделы в «Решения, принятые самостоятельно», каждый со строкой «Статус: ждёт апрува»:
- Красная/зелёная до «Тадама» — ±3 Ресурса (иначе в итерации 1 они пустые и проверять нечего).
- Доли клеток 40/15/15/остальное пустые, 2 пары порталов по четвертям пути; портал двусторонний — встал на дальний, отлетаешь назад.
- Порядок зон ONE → PICK → SUM по третям пути; зона — по клетке, где стоишь в момент броска.
- Цвета: красная `#c8553d`, зелёная `#5a9e4b`, порталы `#8e5bd0`/`#2f8fd8` — фиксированные, не из палитры темы.

- [ ] **Step 4: Коммит**

```bash
git add docs/lucid
git commit -m "docs(lucid): итерация 1 второй версии — поле, зоны кубиков, экономика"
```
