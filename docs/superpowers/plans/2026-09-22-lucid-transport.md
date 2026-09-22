# План реализации: транспорт и комната игры lucid

> **Для агентов:** ОБЯЗАТЕЛЬНЫЙ ПОД-СКИЛЛ — используй superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans, чтобы выполнять план задача за задачей. Шаги размечены чекбоксами (`- [ ]`).

**Цель:** поднять партию lucid по сети — от входа по ссылке до победителя, — не написав ни одного пикселя интерфейса.

**Архитектура:** партия живёт в классе `Party` — обычном объекте без сокетов внутри: он хранит состав, фазу, предложения темы и состояние движка, принимает ходы и выдаёт вид под конкретного игрока. Сокеты снаружи: неймспейс игры, комната socket.io на партию (ADR-0008), таблица обработчиков вместо россыпи `try/catch`. Благодаря этому вся логика комнаты проверяется без сетевых соединений, как это уже сделано в соседней игре.

**Стек:** TypeScript, Node 22, socket.io, Vitest, `node:sqlite`. Воркспейсы `@trgames/server` и `@trgames/shared`.

**Спецификация:** `docs/lucid/CONTEXT.md` (разделы «Клиент» и далее), `docs/lucid/adr/0001-0008`.

**Границы плана:** только сервер. Интерфейс — отдельный план. Результат: партия проходится через API `Party` от лобби до победителя, переживает перезапуск сервера, покрыта тестами.

---

## Что уже готово и на что опираемся

Ядро игры собрано и покрыто 115 тестами:

- `@/games/lucid/core` — `setupParty`, `applyMove`, `EMoveType`, `formatForPlayer`, `buildTrack`, `eventCellIds`, `createRandom`, `rollDie`, `randomInt`, `shuffle`.
- `@/games/lucid/generation` — `generateContent`, `generateJson`, `loadFallbackContent`.
- `@/games/lucid/storage` — `createStorage` с `saveParty`, `loadParty`, `removeParty`, `saveUsage`, `totalUsage`.
- `@/games/lucid/vitest/factories` — `lineTrack`, `forkTrack`, `doubleForkTrack`, `makeG`, `makeFallbackParty`.

Инфраструктура репозитория, которую переиспользуем: `@/helpers/SocketGroup`, `@/helpers/Logger`, `@/i18n`, пакет `uid`.

## Конвенции репозитория

- Одинарные кавычки, точки с запятой, 2 пробела, максимум 120 символов, стрелочные функции.
- **Объектные типы — через `interface`.** Через `type` только алиасы, объединения, типы функций и производные типы. Фрагменты ниже местами написаны через `type` — приводи к `interface`.
- Правила `perfectionist` активны: члены перечислений, ключи объединений и импорты линтер переставит по алфавиту. Подчиняйся линтеру, поведение от этого не меняется.
- Комментарии в коде и сообщения коммитов — на русском.
- **Запуск одного файла тестов:** `yarn workspace @trgames/server test --run <путь>`. Флаг `--run` обязателен: без него путь приклеивается к `--silent` и vitest падает до запуска.
- Перед коммитом прогоняй `npx eslint --fix <файлы>` из корня.
- Pre-commit хук запускает `yarn lint` по всем воркспейсам. Дай ему отработать, не отключай флагом `--no-verify`.
- В конец сообщения коммита добавляй **дословно**, отдельной строкой после пустой:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

**Особенности тестового окружения** (`server/src/vitest/setup.ts`): глобально включены фейковые таймеры с фиксированной датой, `fs` замокан через memfs (база данных только `:memory:`), `Logger` и `FunctionResultObserver` замоканы.

Сокеты в тестах **не поднимаются по-настоящему**: в соседней игре они подменяются объектами с `vi.fn()`, делай так же.

---

## Структура файлов

**Общие типы (`tools/shared/src/games/lucid/types/`)**

| Файл | Ответственность |
|---|---|
| `move.ts` | Ход игрока: `EMoveType`, `TMove` |
| `view.ts` | Что видит игрок: `TStateForPlayer`, `TPartyView`, `TLobbyMember`, `EPartyPhase` |
| `socket.ts` | Имена событий сокета и карты событий в обе стороны |

**Сервер (`server/src/games/lucid/`)**

| Файл | Ответственность |
|---|---|
| `core/autoMove.ts` | Выбор допустимого хода за отсутствующего игрока |
| `room/Party.ts` | Одна партия: состав, фаза, темы, состояние, ходы, виды |
| `room/PartyGroup.ts` | Набор партий по идентификатору, сохранение и восстановление |
| `room/autopilot.ts` | Таймер ожидания и автоматический ход |
| `init.ts` | Неймспейс, рукопожатие, таблица обработчиков |
| `i18n/translations/ru.ts` | Сообщения об ошибках и строки ленты |

Правило импортов прежнее: внутри модуля файлы импортируют друг друга напрямую, барель `index.ts` существует для внешних потребителей.

---

## Задача 1: Вынести контракт хода и вид игрока в общие типы

Клиенту нужны типы хода и вида состояния, а они сейчас живут на сервере. Заодно чиним то, на что указало ревью ядра: журнал партии за сорок минут разрастается на сотни строк и уезжает каждому игроку на каждый ход. В вид игрока он попадать не должен — лента собирается из его прироста (см. `docs/lucid/CONTEXT.md`, «Лента событий»).

**Файлы:**
- Создать: `tools/shared/src/games/lucid/types/move.ts`
- Создать: `tools/shared/src/games/lucid/types/view.ts`
- Изменить: `tools/shared/src/games/lucid/index.ts`
- Изменить: `server/src/games/lucid/core/reducer.ts`
- Изменить: `server/src/games/lucid/core/formatForPlayer.ts`
- Изменить: `server/src/games/lucid/core/formatForPlayer.test.ts`

- [ ] **Шаг 1: Создать типы хода**

`tools/shared/src/games/lucid/types/move.ts`:

```ts
import type { TPlayerId } from './state';

export enum EMoveType {
  CHOOSE_BRANCH = 'CHOOSE_BRANCH',
  CHOOSE_OPTION = 'CHOOSE_OPTION',
  ROLL = 'ROLL',
}

// stateId — версия состояния, на которой игрок принимал решение.
// Не совпала с текущей, значит клиент отстал, и ход отклоняется
export type TMove =
  | { type: EMoveType.ROLL; playerId: TPlayerId; stateId: number }
  | { type: EMoveType.CHOOSE_BRANCH; playerId: TPlayerId; stateId: number; cellId: number }
  | { type: EMoveType.CHOOSE_OPTION; playerId: TPlayerId; stateId: number; optionIndex: number };
```

- [ ] **Шаг 2: Создать типы вида**

`tools/shared/src/games/lucid/types/view.ts`:

```ts
import type { TCtx, TG, TPlayerId } from './state';
import type { TTheme } from './content';

// Состояние глазами одного игрока. Ни состояния генератора случайных чисел,
// ни журнала партии здесь нет: первое позволило бы предсказать все броски,
// второй за партию разрастается на сотни строк и не нужен целиком
export interface TStateForPlayer {
  G: Omit<TG, 'log' | 'random'>;
  ctx: TCtx;
  stateId: number;
  you: TPlayerId;
}

export enum EPartyPhase {
  ENDED = 'ENDED',
  GENERATING = 'GENERATING',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
}

export interface TLobbyMember {
  playerId: TPlayerId;
  nickname: string;
  isConnected: boolean;
  // Предложил тему или отказался предлагать. Отдельной готовности нет:
  // ответ про тему и есть сигнал готовности
  hasAnswered: boolean;
  // Видно всем до жеребьёвки: на чужую выдумку хочется ответить своей
  themeProposal?: string;
}

export interface TPartyView {
  partyId: string;
  phase: EPartyPhase;
  members: TLobbyMember[];
  ownerId: TPlayerId;
  you: TPlayerId;
  // Появляется, как только готова стадия «Мир», раньше состояния партии
  theme?: TTheme;
  // Появляется с началом игры
  state?: TStateForPlayer;
  usedFallback: boolean;
}
```

- [ ] **Шаг 3: Подключить к барелю**

В `tools/shared/src/games/lucid/index.ts` добавить строки (линтер расставит по алфавиту):

```ts
export * from './types/move';
export * from './types/view';
```

- [ ] **Шаг 4: Переключить редьюсер на общие типы**

В `server/src/games/lucid/core/reducer.ts` удалить локальные объявления `EMoveType` и `TMove` и реэкспортировать общие, чтобы существующие импорты не сломались:

```ts
// @trgames/shared отдаёт эти типы только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами, чтобы обращения
// ниже по файлу и во внешних импортах не изменились
export const EMoveType = LucidShared.EMoveType;
export type EMoveType = LucidShared.EMoveType;
export type TMove = LucidShared.TMove;
```

Пара `const` и `type` с одним именем — обычный приём слияния значения и типа: так `EMoveType` продолжает работать и как значение, и как тип.

Внутри файла обращения к `EMoveType` и `TMove` оставить прежними — они теперь ссылаются на общие типы. `LucidShared.EMoveType` тоже доступен, выбери одну форму и держись её во всём файле.

- [ ] **Шаг 5: Убрать журнал из вида игрока**

В `server/src/games/lucid/core/formatForPlayer.ts` удалить локальное объявление `TStateForPlayer`, реэкспортировать общее и убрать `log` из перечисления полей:

```ts
// Плоского реэкспорта у пакета нет, только неймспейс
export type TStateForPlayer = LucidShared.TStateForPlayer;
```

В самой функции убрать строку `log: state.G.log,` из списка полей. Комментарий про список разрешённого сохранить и дополнить: журнал не отдаётся целиком, лента собирается из его прироста на стороне комнаты.

- [ ] **Шаг 6: Поправить тест**

В `server/src/games/lucid/core/formatForPlayer.test.ts` добавить проверку:

```ts
  it('не отдаёт журнал партии: он уходит лентой, а не целиком', () => {
    expect('log' in formatForPlayer(makeParty(), 'a').G).toBe(false);
  });
```

- [ ] **Шаг 7: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: 116 тестов, все зелёные.

Выполнить: `yarn workspace @trgames/shared lint`
Ожидается: чисто.

- [ ] **Шаг 8: Коммит**

```bash
git add tools/shared/src/games/lucid server/src/games/lucid/core
git commit -m "refactor(lucid): вынести контракт хода и вид игрока в общие типы"
```

---

## Задача 2: Имена событий сокета

**Файлы:**
- Создать: `tools/shared/src/games/lucid/types/socket.ts`
- Изменить: `tools/shared/src/games/lucid/index.ts`

- [ ] **Шаг 1: Описать события**

`tools/shared/src/games/lucid/types/socket.ts`:

```ts
import type { TMove } from './move';
import type { TPartyView } from './view';

export enum ELucidEvent {
  appendRibbon = 'append-ribbon',
  declineTheme = 'decline-theme',
  makeMove = 'make-move',
  playAgain = 'play-again',
  proposeTheme = 'propose-theme',
  showError = 'show-error',
  startParty = 'start-party',
  updateParty = 'update-party',
}

export interface TLucidServerToClientEvents {
  // Одно сообщение на все фазы: клиент рисует то, что прислали, и ничего
  // не достраивает сам
  [ELucidEvent.updateParty]: (view: TPartyView) => void;
  // Только прирост ленты, а не журнал целиком
  [ELucidEvent.appendRibbon]: (lines: string[]) => void;
  [ELucidEvent.showError]: (params: { message: string }) => void;
}

export interface TLucidClientToServerEvents {
  [ELucidEvent.proposeTheme]: (theme: string) => void;
  [ELucidEvent.declineTheme]: () => void;
  [ELucidEvent.startParty]: () => void;
  [ELucidEvent.makeMove]: (move: TMove) => void;
  [ELucidEvent.playAgain]: () => void;
}
```

Заметь: событий «войти в партию» нет. Игрок опознаётся при рукопожатии, как в соседней игре, — подробности в задаче 10.

- [ ] **Шаг 2: Подключить к барелю**

В `tools/shared/src/games/lucid/index.ts` добавить:

```ts
export * from './types/socket';
```

- [ ] **Шаг 3: Проверка и коммит**

Выполнить: `yarn workspace @trgames/shared lint`
Ожидается: чисто.

```bash
git add tools/shared/src/games/lucid
git commit -m "feat(lucid): описать события сокета"
```

---

## Задача 3: Стадийная генерация

Ожидание устроено как раскрытие: стадия «Мир» приходит быстро, и тема сразу перекрашивает экран, пока события ещё генерируются (`docs/lucid/CONTEXT.md`, «Ожидание генерации»). Сейчас `generateContent` молчит до конца.

**Файлы:**
- Изменить: `server/src/games/lucid/generation/pipeline.ts`
- Изменить: `server/src/games/lucid/generation/pipeline.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

В `server/src/games/lucid/generation/pipeline.test.ts` добавить в блок `describe('generateContent', ...)`:

```ts
  it('сообщает о готовности мира до того, как готовы события', async () => {
    const seen: string[] = [];
    const generateJson: TGenerateJson = vi.fn()
      .mockImplementationOnce(async () => {
        seen.push('запрос мира');

        return { data: validWorld, usage };
      })
      .mockImplementation(async () => {
        seen.push('запрос событий');

        return { data: eventsFor([1, 2]), usage };
      });

    await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня'],
      eventCellIds: [1, 2],
      deadlineMs: Date.now() + 10_000,
      seed: 'stages',
      onWorld: theme => seen.push(`мир готов: ${theme.name}`),
    });

    expect(seen).toEqual(['запрос мира', 'мир готов: Пираты', 'запрос событий']);
  });

  it('о готовности мира не сообщает, если играем на запасной партии', async () => {
    const onWorld = vi.fn();
    const generateJson: TGenerateJson = vi.fn().mockRejectedValue(new Error('сеть недоступна'));

    await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня'],
      eventCellIds: [1],
      deadlineMs: Date.now() + 10_000,
      seed: 'stages',
      onWorld,
    });

    expect(onWorld).not.toHaveBeenCalled();
  });
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/generation/pipeline.test.ts`
Ожидается: падение, потому что `onWorld` не вызывается.

- [ ] **Шаг 3: Добавить обратный вызов**

В `server/src/games/lucid/generation/pipeline.ts` добавить в параметры:

```ts
  // Вызывается, как только готова стадия «Мир»: тема перекрашивает экран,
  // пока события ещё генерируются
  onWorld?: (theme: LucidShared.TTheme) => void;
```

И сразу после успешного получения мира, до запроса событий:

```ts
    onWorld?.(world.theme);
```

Важно: при откате на запасную партию `onWorld` не вызывается — тема запасной партии приедет вместе с готовым контентом, отдельного раскрытия для неё нет.

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: 118 тестов, все зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/generation
git commit -m "feat(lucid): сообщать о готовности мира до готовности событий"
```

---

## Задача 4: Выбор хода за отсутствующего

Автопилот ходит за того, кто потерял связь или ушёл (`docs/lucid/CONTEXT.md`, «Отвалившийся игрок», «Ушедший игрок»). Такая же логика уже написана внутри сквозного теста ядра как бот — вынесем её и будем использовать в обоих местах, чтобы автопилот проверялся тем же перебором на двадцати пяти партиях.

**Файлы:**
- Создать: `server/src/games/lucid/core/autoMove.ts`
- Создать: `server/src/games/lucid/core/autoMove.test.ts`
- Изменить: `server/src/games/lucid/lucid.integration.test.ts`
- Изменить: `server/src/games/lucid/core/index.ts`

- [ ] **Шаг 1: Написать падающий тест**

`server/src/games/lucid/core/autoMove.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LucidShared } from '@trgames/shared';

import { chooseAutoMove } from '@/games/lucid/core/autoMove';
import { lineTrack } from '@/games/lucid/vitest/factories';
import { makeFallbackParty } from '@/games/lucid/vitest/factories';

describe('chooseAutoMove', () => {
  it('в фазе броска бросает кубик', () => {
    const state = makeFallbackParty({ seed: 'auto-roll' });

    expect(chooseAutoMove(state)?.type).toBe(LucidShared.EMoveType.ROLL);
  });

  it('в фазе развилки берёт первую доступную ветку', () => {
    const state = makeFallbackParty({ seed: 'auto-branch' });
    state.ctx.phase = LucidShared.EPhase.BRANCH;
    state.G.branchChoices = [4, 7];

    const move = chooseAutoMove(state);

    expect(move).toEqual({
      type: LucidShared.EMoveType.CHOOSE_BRANCH,
      playerId: state.ctx.currentPlayer,
      stateId: state.stateId,
      cellId: 4,
    });
  });

  it('в фазе выбора берёт первый вариант, который по карману', () => {
    const state = makeFallbackParty({ seed: 'auto-option' });
    const playerId = state.ctx.currentPlayer;
    state.G.track = lineTrack();
    state.G.players[playerId].position = 1;
    state.G.players[playerId].resource = 0;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Лавка',
        text: 'Дорого',
        options: [
          {
            text: 'Купить',
            cost: 3,
            success: {
              atoms: [{
                kind: LucidShared.EAtomKind.RESOURCE,
                target: LucidShared.ETarget.SELF,
                value: 1,
              }],
            },
          },
          {
            text: 'Посмотреть',
            success: {
              atoms: [{
                kind: LucidShared.EAtomKind.RESOURCE,
                target: LucidShared.ETarget.SELF,
                value: 1,
              }],
            },
          },
        ],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    // Первый вариант недоступен по цене: движок такой ход отклонит,
    // и автопилот зациклился бы, выбирая его снова и снова
    expect(chooseAutoMove(state)).toMatchObject({ optionIndex: 1 });
  });

  it('после конца партии ходить нечем', () => {
    const state = makeFallbackParty({ seed: 'auto-ended' });
    state.ctx.phase = LucidShared.EPhase.ENDED;

    expect(chooseAutoMove(state)).toBeNull();
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/core/autoMove.test.ts`
Ожидается: падение с сообщением о том, что модуль `@/games/lucid/core/autoMove` не найден.

- [ ] **Шаг 3: Написать реализацию**

`server/src/games/lucid/core/autoMove.ts`:

```ts
import { LucidShared } from '@trgames/shared';

// Ход за отсутствующего игрока: кубик, первая ветка на развилке, первый
// доступный по цене вариант события. Недоступный вариант брать нельзя —
// движок такой ход отклонит, и автопилот застрянет на нём навсегда
export const chooseAutoMove = (state: LucidShared.TState): LucidShared.TMove | null => {
  const playerId = state.ctx.currentPlayer;
  const stateId = state.stateId;

  if (state.ctx.phase === LucidShared.EPhase.ROLL) {
    return { type: LucidShared.EMoveType.ROLL, playerId, stateId };
  }

  if (state.ctx.phase === LucidShared.EPhase.BRANCH) {
    const [cellId] = state.G.branchChoices;

    return cellId === undefined
      ? null
      : { type: LucidShared.EMoveType.CHOOSE_BRANCH, playerId, stateId, cellId };
  }

  if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
    const player = state.G.players[playerId];
    const options = state.G.events[player.position]?.options ?? [];
    const optionIndex = options.findIndex(option => !option.cost || option.cost <= player.resource);

    return optionIndex === -1
      ? null
      : { type: LucidShared.EMoveType.CHOOSE_OPTION, playerId, stateId, optionIndex };
  }

  return null;
};
```

- [ ] **Шаг 4: Переключить сквозной тест на общую функцию**

В `server/src/games/lucid/lucid.integration.test.ts` заменить тело цикла в `playToEnd` так, чтобы ход выбирался через `chooseAutoMove`, а счётчики фаз считались по `state.ctx.phase` до применения хода:

```ts
    if (state.ctx.phase === LucidShared.EPhase.BRANCH) {
      branchOffers++;
    }

    if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
      choiceOffers++;
    }

    const move = chooseAutoMove(state);

    if (!move) {
      break;
    }

    state = applyMove(state, move);
```

Импорт `chooseAutoMove` добавить. Прежний выбор ветки в боте брал вторую ветку (`branchChoices[1]`), а `chooseAutoMove` берёт первую — это допустимо, тесты проверяют число предложений развилки, а не какую именно выбрали.

- [ ] **Шаг 5: Добавить в барель**

В `server/src/games/lucid/core/index.ts` добавить строку:

```ts
export * from './autoMove';
```

- [ ] **Шаг 6: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: 122 теста, все зелёные. Сквозной тест обязан остаться зелёным: если он покраснел, значит `chooseAutoMove` ведёт себя не так, как прежний бот, и чинить надо функцию, а не тест.

- [ ] **Шаг 7: Коммит**

```bash
git add server/src/games/lucid
git commit -m "feat(lucid): вынести выбор хода за отсутствующего игрока"
```

---

## Задача 5: Партия — состав и предложения темы

`Party` — обычный объект без сокетов внутри. Наружу он отдаёт вид, а как этот вид попадёт игрокам, решает слой сокетов (задача 10). Благодаря этому вся логика комнаты проверяется без сетевых соединений.

**Файлы:**
- Создать: `server/src/games/lucid/room/Party.ts`
- Создать: `server/src/games/lucid/room/Party.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

`server/src/games/lucid/room/Party.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LucidShared } from '@trgames/shared';

import { Party } from '@/games/lucid/room/Party';

const makeParty = () => new Party({ uuid: 'p1', ownerId: 'a' });

describe('состав партии', () => {
  it('первый вошедший становится владельцем', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.view('a').ownerId).toBe('a');
  });

  it('вошедшие видны всем', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });

    expect(party.view('a').members.map(member => member.nickname)).toEqual(['Аня', 'Боря']);
  });

  it('ник, занятый другим игроком, отклоняется', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(() => party.join({ playerId: 'b', nickname: 'Аня' })).toThrow();
  });

  it('тот же игрок входит повторно и не удваивается', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.view('a').members).toHaveLength(1);
  });

  it('возвращение под другим ником не создаёт нового игрока', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'a', nickname: 'Анна' });

    const [member] = party.view('a').members;

    expect(member.nickname).toBe('Анна');
    expect(party.view('a').members).toHaveLength(1);
  });

  it('потеря связи не убирает игрока из состава', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.disconnect('a');

    const [member] = party.view('a').members;

    expect(member.isConnected).toBe(false);
    expect(party.view('a').members).toHaveLength(1);
  });
});

describe('предложения темы', () => {
  const partyWithTwo = () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });

    return party;
  };

  it('предложение видно всем до жеребьёвки', () => {
    const party = partyWithTwo();
    party.proposeTheme('a', 'пираты');

    const [member] = party.view('b').members;

    expect(member.themeProposal).toBe('пираты');
    expect(member.hasAnswered).toBe(true);
  });

  it('отказ тоже считается ответом', () => {
    const party = partyWithTwo();
    party.declineTheme('a');

    const [member] = party.view('b').members;

    expect(member.themeProposal).toBeUndefined();
    expect(member.hasAnswered).toBe(true);
  });

  it('предложение можно заменить, пока партия не началась', () => {
    const party = partyWithTwo();
    party.proposeTheme('a', 'пираты');
    party.proposeTheme('a', 'киберпанк');

    expect(party.view('a').members[0].themeProposal).toBe('киберпанк');
  });

  it('пустое предложение отклоняется', () => {
    const party = partyWithTwo();

    expect(() => party.proposeTheme('a', '   ')).toThrow();
  });

  it('слишком длинное предложение отклоняется', () => {
    const party = partyWithTwo();

    expect(() => party.proposeTheme('a', 'т'.repeat(201))).toThrow();
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: падение с сообщением о том, что модуль `@/games/lucid/room/Party` не найден.

- [ ] **Шаг 3: Написать реализацию**

`server/src/games/lucid/room/Party.ts`:

```ts
import { LucidShared } from '@trgames/shared';

const MAX_THEME_LENGTH = 200;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

interface TPartyConstructorParams {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
}

interface TJoinParams {
  playerId: LucidShared.TPlayerId;
  nickname: string;
}

export interface TMember {
  playerId: LucidShared.TPlayerId;
  nickname: string;
  isConnected: boolean;
  hasAnswered: boolean;
  themeProposal?: string;
}

export class Party {
  public readonly uuid: string;
  public readonly ownerId: LucidShared.TPlayerId;

  private phase: LucidShared.EPartyPhase = LucidShared.EPartyPhase.LOBBY;
  private readonly members = new Map<LucidShared.TPlayerId, TMember>();
  private theme?: LucidShared.TTheme;
  private state?: LucidShared.TState;
  private usedFallback = false;

  constructor({ uuid, ownerId }: TPartyConstructorParams) {
    this.uuid = uuid;
    this.ownerId = ownerId;
  }

  public get isFull(): boolean {
    return this.members.size >= MAX_PLAYERS;
  }

  public get canStart(): boolean {
    return this.phase === LucidShared.EPartyPhase.LOBBY && this.members.size >= MIN_PLAYERS;
  }

  public join = ({ playerId, nickname }: TJoinParams): void => {
    const trimmed = nickname.trim();

    if (!trimmed) {
      throw new Error('empty-nickname');
    }

    // Ник опознаёт игрока для людей, а не для системы: повторы запрещены,
    // иначе игроки не смогут однозначно говорить друг о друге
    const taken = [...this.members.values()]
      .some(member => member.playerId !== playerId && member.nickname === trimmed);

    if (taken) {
      throw new Error('nickname-taken');
    }

    const existing = this.members.get(playerId);

    if (existing) {
      // Тот же игрок вернулся: место и ответ про тему сохраняются,
      // обновляется только подпись и связь
      existing.nickname = trimmed;
      existing.isConnected = true;

      return;
    }

    if (this.phase !== LucidShared.EPartyPhase.LOBBY) {
      throw new Error('party-already-started');
    }

    if (this.isFull) {
      throw new Error('party-is-full');
    }

    this.members.set(playerId, {
      playerId,
      nickname: trimmed,
      isConnected: true,
      hasAnswered: false,
    });
  };

  public disconnect = (playerId: LucidShared.TPlayerId): void => {
    const member = this.members.get(playerId);

    if (member) {
      member.isConnected = false;
    }
  };

  public proposeTheme = (playerId: LucidShared.TPlayerId, theme: string): void => {
    const member = this.requireLobbyMember(playerId);
    const trimmed = theme.trim();

    if (!trimmed) {
      throw new Error('empty-theme');
    }

    if (trimmed.length > MAX_THEME_LENGTH) {
      throw new Error('theme-too-long');
    }

    member.themeProposal = trimmed;
    member.hasAnswered = true;
  };

  public declineTheme = (playerId: LucidShared.TPlayerId): void => {
    const member = this.requireLobbyMember(playerId);

    member.themeProposal = undefined;
    member.hasAnswered = true;
  };

  public view = (playerId: LucidShared.TPlayerId): LucidShared.TPartyView => ({
    partyId: this.uuid,
    phase: this.phase,
    members: [...this.members.values()].map(member => ({ ...member })),
    ownerId: this.ownerId,
    you: playerId,
    theme: this.theme,
    state: undefined,
    usedFallback: this.usedFallback,
  });

  private requireLobbyMember = (playerId: LucidShared.TPlayerId): TMember => {
    if (this.phase !== LucidShared.EPartyPhase.LOBBY) {
      throw new Error('party-already-started');
    }

    const member = this.members.get(playerId);

    if (!member) {
      throw new Error('not-a-member');
    }

    return member;
  };
}
```

Поле `state` пока объявлено, но не заполняется — оно оживёт в задаче 7.

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: все одиннадцать тестов зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/room
git commit -m "feat(lucid): добавить состав партии и предложения темы"
```

---

## Задача 6: Жеребьёвка темы и запуск генерации

Тему выбирает бросок кубика среди предложенных: кубик уже есть в игре, ничего не стоит и снимает неловкость «почему опять взяли Петину тему» (`docs/lucid/CONTEXT.md`, «Выбор темы»).

**Файлы:**
- Изменить: `server/src/games/lucid/room/Party.ts`
- Изменить: `server/src/games/lucid/room/Party.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Добавить в `server/src/games/lucid/room/Party.test.ts` новый блок:

```ts
describe('жеребьёвка темы', () => {
  const partyWithThemes = (uuid: string) => {
    const party = new Party({ uuid, ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });
    party.join({ playerId: 'c', nickname: 'Вася' });

    return party;
  };

  it('выбирает одну из предложенных тем', () => {
    const party = partyWithThemes('draw-1');
    party.proposeTheme('a', 'пираты');
    party.proposeTheme('b', 'киберпанк');
    party.declineTheme('c');

    expect(['пираты', 'киберпанк']).toContain(party.drawTheme());
  });

  it('жеребьёвка воспроизводима: та же партия даёт тот же выбор', () => {
    const first = partyWithThemes('draw-same');
    first.proposeTheme('a', 'пираты');
    first.proposeTheme('b', 'киберпанк');

    const second = partyWithThemes('draw-same');
    second.proposeTheme('a', 'пираты');
    second.proposeTheme('b', 'киберпанк');

    expect(first.drawTheme()).toBe(second.drawTheme());
  });

  it('отказавшийся в жеребьёвке не участвует', () => {
    const party = partyWithThemes('draw-decline');
    party.declineTheme('a');
    party.declineTheme('b');
    party.proposeTheme('c', 'офис');

    expect(party.drawTheme()).toBe('офис');
  });

  it('если не предложил никто, тема берётся из подсказок', () => {
    const party = partyWithThemes('draw-empty');
    party.declineTheme('a');

    expect(THEME_HINTS).toContain(party.drawTheme());
  });
});
```

Импорт `THEME_HINTS` из `@/games/lucid/room/Party` добавить к существующим.

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: падение, потому что `drawTheme` и `THEME_HINTS` не существуют.

- [ ] **Шаг 3: Написать реализацию**

В `server/src/games/lucid/room/Party.ts` добавить импорт и подсказки:

```ts
import { createRandom, randomInt } from '@/games/lucid/core/random';

// Для тех случаев, когда не предложил никто
export const THEME_HINTS = [
  'заброшенная космическая станция',
  'пираты южных морей',
  'офис перед сдачей квартального отчёта',
  'киберпанковые трущобы',
  'экспедиция во льдах',
];
```

И метод:

```ts
  // Тему выбирает кубик, а не создатель партии: мир игрокам не выбирается,
  // он им достаётся. Сид взят от партии, поэтому жеребьёвка воспроизводима
  public drawTheme = (): string => {
    const proposals = [...this.members.values()]
      .map(member => member.themeProposal)
      .filter((theme): theme is string => Boolean(theme));
    const pool = proposals.length > 0 ? proposals : THEME_HINTS;
    const picked = randomInt(createRandom(`${this.uuid}:theme`), 0, pool.length - 1);

    return pool[picked.value];
  };
```

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: все пятнадцать тестов зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/room
git commit -m "feat(lucid): выбирать тему жеребьёвкой среди предложенных"
```

---

## Задача 7: Старт партии, стадии и ходы

Здесь партия впервые оживает: запускается генерация, приходит тема, собирается состояние, принимаются ходы.

**Файлы:**
- Изменить: `server/src/games/lucid/room/Party.ts`
- Изменить: `server/src/games/lucid/room/Party.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Добавить в `server/src/games/lucid/room/Party.test.ts`:

```ts
describe('старт партии', () => {
  const readyParty = (uuid: string) => {
    const party = new Party({ uuid, ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });
    party.proposeTheme('a', 'пираты');
    party.declineTheme('b');

    return party;
  };

  const content = (): LucidShared.TPartyContent => ({
    theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#102030', '#405060', '#708090'] },
    events: {},
  });

  it('одному играть нельзя', () => {
    const party = new Party({ uuid: 'alone', ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.canStart).toBe(false);
  });

  it('во время генерации партия в соответствующей фазе', async () => {
    const party = readyParty('start-phase');
    const started = party.start({
      generate: async () => ({ content: content(), usedFallback: false }),
    });

    expect(party.view('a').phase).toBe(LucidShared.EPartyPhase.GENERATING);

    await started;
  });

  it('после генерации партия играется и состояние видно игроку', async () => {
    const party = readyParty('start-done');

    await party.start({ generate: async () => ({ content: content(), usedFallback: false }) });

    const view = party.view('a');

    expect(view.phase).toBe(LucidShared.EPartyPhase.PLAYING);
    expect(view.state?.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(view.state?.you).toBe('a');
    expect(view.theme?.name).toBe('Пираты');
  });

  it('тема мира приходит раньше состояния', async () => {
    const party = readyParty('start-world');
    const seen: (string | undefined)[] = [];

    await party.start({
      generate: async ({ onWorld }) => {
        onWorld({ name: 'Ранний мир', resourceName: 'монеты', palette: ['#111111'] });
        seen.push(party.view('a').theme?.name);
        seen.push(party.view('a').state?.you);

        return { content: content(), usedFallback: false };
      },
    });

    expect(seen).toEqual(['Ранний мир', undefined]);
  });

  it('игра на запасной партии отмечена', async () => {
    const party = readyParty('start-fallback');

    await party.start({ generate: async () => ({ content: content(), usedFallback: true }) });

    expect(party.view('a').usedFallback).toBe(true);
  });

  it('ход принимается и меняет состояние', async () => {
    const party = readyParty('start-move');
    await party.start({ generate: async () => ({ content: content(), usedFallback: false }) });

    const before = party.view('a').state!;
    party.applyMove({
      type: LucidShared.EMoveType.ROLL,
      playerId: before.ctx.currentPlayer,
      stateId: before.stateId,
    });

    expect(party.view('a').state!.stateId).toBe(before.stateId + 1);
  });

  it('ход чужого игрока не проходит', async () => {
    const party = readyParty('start-foreign');
    await party.start({ generate: async () => ({ content: content(), usedFallback: false }) });

    const before = party.view('a').state!;
    const other = before.ctx.currentPlayer === 'a' ? 'b' : 'a';

    party.applyMove({ type: LucidShared.EMoveType.ROLL, playerId: other, stateId: before.stateId });

    expect(party.view('a').state!.stateId).toBe(before.stateId);
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: падение, потому что `start` и `applyMove` не существуют.

- [ ] **Шаг 3: Написать реализацию**

В `server/src/games/lucid/room/Party.ts` добавить импорты:

```ts
import { applyMove as applyMoveToState } from '@/games/lucid/core/reducer';
import { buildTrack, eventCellIds } from '@/games/lucid/core/track';
import { formatForPlayer } from '@/games/lucid/core/formatForPlayer';
import { setupParty } from '@/games/lucid/core/setup';
```

И типы с методами:

```ts
interface TGenerateParams {
  theme: string;
  nicknames: string[];
  eventCellIds: number[];
  seed: string;
  onWorld: (theme: LucidShared.TTheme) => void;
}

interface TGenerateResult {
  content: LucidShared.TPartyContent;
  usedFallback: boolean;
}

interface TStartParams {
  generate: (params: TGenerateParams) => Promise<TGenerateResult>;
}
```

```ts
  // Генерация передаётся параметром, а не берётся изнутри: так партия
  // проверяется без обращений к сети
  public start = async ({ generate }: TStartParams): Promise<void> => {
    if (!this.canStart) {
      throw new Error('cannot-start');
    }

    this.phase = LucidShared.EPartyPhase.GENERATING;

    const players = [...this.members.values()]
      .map(member => ({ id: member.playerId, nickname: member.nickname }));
    // Трек строится здесь ради номеров клеток событий, а внутри setupParty
    // соберётся заново из того же сида — построение детерминировано
    const track = buildTrack({
      random: createRandom(`${this.uuid}:track`),
      playerCount: players.length,
    });

    const { content, usedFallback } = await generate({
      theme: this.drawTheme(),
      nicknames: players.map(player => player.nickname),
      eventCellIds: eventCellIds(track),
      seed: this.uuid,
      onWorld: theme => {
        this.theme = theme;
      },
    });

    this.theme = content.theme;
    this.usedFallback = usedFallback;
    this.state = setupParty({ seed: this.uuid, players, content });
    this.phase = LucidShared.EPartyPhase.PLAYING;
  };

  public applyMove = (move: LucidShared.TMove): void => {
    if (!this.state || this.phase !== LucidShared.EPartyPhase.PLAYING) {
      return;
    }

    this.state = applyMoveToState(this.state, move);

    if (this.state.ctx.phase === LucidShared.EPhase.ENDED) {
      this.phase = LucidShared.EPartyPhase.ENDED;
    }
  };
```

И заменить в `view` строку `state: undefined,` на:

```ts
    state: this.state ? formatForPlayer(this.state, playerId) : undefined,
```

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: все двадцать два теста зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/room
git commit -m "feat(lucid): добавить старт партии и приём ходов"
```

---

## Задача 8: Лента событий приростом

Сервер шлёт прирост ленты, а не журнал целиком: иначе размер сообщения растёт вместе с партией (`docs/lucid/CONTEXT.md`, «Лента событий»).

**Файлы:**
- Изменить: `server/src/games/lucid/room/Party.ts`
- Изменить: `server/src/games/lucid/room/Party.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Добавить в `server/src/games/lucid/room/Party.test.ts`:

```ts
describe('лента событий', () => {
  const playingParty = async (uuid: string) => {
    const party = new Party({ uuid, ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });
    party.proposeTheme('a', 'пираты');
    await party.start({
      generate: async () => ({
        content: {
          theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#102030'] },
          events: {},
        },
        usedFallback: false,
      }),
    });

    return party;
  };

  it('после хода появляются новые строки', async () => {
    const party = await playingParty('ribbon-move');
    const before = party.view('a').state!;

    party.applyMove({
      type: LucidShared.EMoveType.ROLL,
      playerId: before.ctx.currentPlayer,
      stateId: before.stateId,
    });

    expect(party.takeRibbonDelta().length).toBeGreaterThan(0);
  });

  it('прирост отдаётся один раз', async () => {
    const party = await playingParty('ribbon-once');
    const before = party.view('a').state!;

    party.applyMove({
      type: LucidShared.EMoveType.ROLL,
      playerId: before.ctx.currentPlayer,
      stateId: before.stateId,
    });
    party.takeRibbonDelta();

    expect(party.takeRibbonDelta()).toEqual([]);
  });

  it('отклонённый ход ленту не трогает', async () => {
    const party = await playingParty('ribbon-rejected');
    party.takeRibbonDelta();

    party.applyMove({ type: LucidShared.EMoveType.ROLL, playerId: 'нет-такого', stateId: 0 });

    expect(party.takeRibbonDelta()).toEqual([]);
  });

  it('строку можно добавить и вручную', async () => {
    const party = await playingParty('ribbon-manual');
    party.takeRibbonDelta();

    party.addRibbonLine('Придумать ваш мир не получилось, играем на запасном');

    expect(party.takeRibbonDelta()).toEqual([
      'Придумать ваш мир не получилось, играем на запасном',
    ]);
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: падение, потому что `takeRibbonDelta` и `addRibbonLine` не существуют.

- [ ] **Шаг 3: Написать реализацию**

В `server/src/games/lucid/room/Party.ts` добавить поле и методы:

```ts
  // Сколько строк журнала уже разослано. Лента — это его прирост,
  // а не журнал целиком: за сорок минут в нём накапливаются сотни строк
  private sentRibbonLines = 0;
  private readonly extraRibbonLines: string[] = [];
```

```ts
  // Строка от самой игры, а не от движка: например, честное признание,
  // что придумать мир не получилось
  public addRibbonLine = (line: string): void => {
    this.extraRibbonLines.push(line);
  };

  public takeRibbonDelta = (): string[] => {
    const fromState = this.state?.G.log.slice(this.sentRibbonLines) ?? [];
    const delta = [...fromState, ...this.extraRibbonLines];

    this.sentRibbonLines += fromState.length;
    this.extraRibbonLines.length = 0;

    return delta;
  };
```

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/Party.test.ts`
Ожидается: все двадцать шесть тестов зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/room
git commit -m "feat(lucid): отдавать ленту событий приростом"
```

---

## Задача 9: Автопилот

Пропала связь — тридцать секунд ожидания — дальше за игрока ходит автопилот, и это видно всем (`docs/lucid/CONTEXT.md`, «Отвалившийся игрок», «Автопилот на виду»).

**Файлы:**
- Создать: `server/src/games/lucid/room/autopilot.ts`
- Создать: `server/src/games/lucid/room/autopilot.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

`server/src/games/lucid/room/autopilot.test.ts`:

```ts
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AUTOPILOT_DELAY_MS, createAutopilot } from '@/games/lucid/room/autopilot';

describe('createAutopilot', () => {
  it('ходит не раньше срока', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS - 1);

    expect(play).not.toHaveBeenCalled();
  });

  it('по истечении срока ходит за игрока', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS);

    expect(play).toHaveBeenCalledWith('a');
  });

  it('вернувшийся игрок отменяет автопилот', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.cancel('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS * 2);

    expect(play).not.toHaveBeenCalled();
  });

  it('за каждого отвалившегося свой срок', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.schedule('b');
    autopilot.cancel('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS);

    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('b');
  });

  it('остановка снимает все сроки', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.stop();
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS * 2);

    expect(play).not.toHaveBeenCalled();
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/autopilot.test.ts`
Ожидается: падение с сообщением о том, что модуль `@/games/lucid/room/autopilot` не найден.

- [ ] **Шаг 3: Написать реализацию**

`server/src/games/lucid/room/autopilot.ts`:

```ts
import type { LucidShared } from '@trgames/shared';

// Столько ждём переподключения, прежде чем ходить за игрока. Таймер существует
// против упавшего вайфая, а не против медленных игроков: те, кто на связи,
// думают сколько хотят
export const AUTOPILOT_DELAY_MS = 30_000;

interface TCreateAutopilotParams {
  play: (playerId: LucidShared.TPlayerId) => void;
}

export const createAutopilot = ({ play }: TCreateAutopilotParams) => {
  const timers = new Map<LucidShared.TPlayerId, ReturnType<typeof setTimeout>>();

  const cancel = (playerId: LucidShared.TPlayerId): void => {
    const timer = timers.get(playerId);

    if (timer) {
      clearTimeout(timer);
      timers.delete(playerId);
    }
  };

  return {
    cancel,

    schedule: (playerId: LucidShared.TPlayerId): void => {
      cancel(playerId);
      timers.set(playerId, setTimeout(() => {
        timers.delete(playerId);
        play(playerId);
      }, AUTOPILOT_DELAY_MS));
    },

    stop: (): void => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    },
  };
};

export type TAutopilot = ReturnType<typeof createAutopilot>;
```

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/autopilot.test.ts`
Ожидается: все пять тестов зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid/room
git commit -m "feat(lucid): добавить автопилот за отвалившегося игрока"
```

---

## Задача 10: Набор партий и переживание перезапуска

Партия идёт около сорока минут, и уронить её деплоем недопустимо. Состояние сохраняется в базу после каждого хода и поднимается оттуда, когда партию снова спросили.

**Файлы:**
- Создать: `server/src/games/lucid/room/PartyGroup.ts`
- Создать: `server/src/games/lucid/room/PartyGroup.test.ts`
- Изменить: `server/src/games/lucid/room/Party.ts`

- [ ] **Шаг 1: Написать падающий тест**

`server/src/games/lucid/room/PartyGroup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LucidShared } from '@trgames/shared';

import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createStorage } from '@/games/lucid/storage/db';

const content = (): LucidShared.TPartyContent => ({
  theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#102030'] },
  events: {},
});

const startedParty = async (group: ReturnType<typeof createPartyGroup>, uuid: string) => {
  const party = group.create({ uuid, ownerId: 'a' });
  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });
  party.proposeTheme('a', 'пираты');
  await party.start({ generate: async () => ({ content: content(), usedFallback: false }) });

  return party;
};

describe('PartyGroup', () => {
  it('созданная партия находится по идентификатору', () => {
    const group = createPartyGroup({ storage: createStorage(':memory:') });
    group.create({ uuid: 'p1', ownerId: 'a' });

    expect(group.get('p1')?.uuid).toBe('p1');
  });

  it('несуществующая партия не находится', () => {
    const group = createPartyGroup({ storage: createStorage(':memory:') });

    expect(group.get('нет-такой')).toBeNull();
  });

  it('партия переживает перезапуск сервера', async () => {
    const storage = createStorage(':memory:');
    const group = createPartyGroup({ storage });
    const party = await startedParty(group, 'p1');
    const before = party.view('a').state!;

    // Новый набор партий — как будто сервер перезапустили: память пуста,
    // а база на месте
    const afterRestart = createPartyGroup({ storage });
    const restored = afterRestart.get('p1');

    expect(restored?.view('a').state?.stateId).toBe(before.stateId);
    expect(restored?.view('a').members).toHaveLength(2);
  });

  it('удалённая партия не восстанавливается', async () => {
    const storage = createStorage(':memory:');
    const group = createPartyGroup({ storage });
    await startedParty(group, 'p1');
    group.remove('p1');

    expect(createPartyGroup({ storage }).get('p1')).toBeNull();
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/PartyGroup.test.ts`
Ожидается: падение с сообщением о том, что модуль `@/games/lucid/room/PartyGroup` не найден.

- [ ] **Шаг 3: Научить партию сохраняться и восстанавливаться**

В `server/src/games/lucid/room/Party.ts` добавить два метода. Снимок — это обычные данные: состояние партии проектировалось сериализуемым именно ради этого.

```ts
interface TPartySnapshot {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
  phase: LucidShared.EPartyPhase;
  members: TMember[];
  theme?: LucidShared.TTheme;
  state?: LucidShared.TState;
  usedFallback: boolean;
  sentRibbonLines: number;
}
```

```ts
  public snapshot = (): TPartySnapshot => ({
    uuid: this.uuid,
    ownerId: this.ownerId,
    phase: this.phase,
    members: [...this.members.values()].map(member => ({ ...member })),
    theme: this.theme,
    state: this.state,
    usedFallback: this.usedFallback,
    sentRibbonLines: this.sentRibbonLines,
  });

  public static fromSnapshot = (snapshot: TPartySnapshot): Party => {
    const party = new Party({ uuid: snapshot.uuid, ownerId: snapshot.ownerId });

    party.phase = snapshot.phase;
    party.theme = snapshot.theme;
    party.state = snapshot.state;
    party.usedFallback = snapshot.usedFallback;
    party.sentRibbonLines = snapshot.sentRibbonLines;
    // После перезапуска сервера соединений нет ни у кого: связь восстановится,
    // когда клиенты переподключатся
    snapshot.members.forEach(member => {
      party.members.set(member.playerId, { ...member, isConnected: false });
    });

    return party;
  };
```

Тип `TPartySnapshot` экспортировать.

- [ ] **Шаг 4: Написать набор партий**

`server/src/games/lucid/room/PartyGroup.ts`:

```ts
import type { LucidShared } from '@trgames/shared';

import type { TStorage } from '@/games/lucid/storage/db';
import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { Party } from '@/games/lucid/room/Party';

interface TCreatePartyGroupParams {
  storage: TStorage;
}

interface TCreateParams {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
}

export const createPartyGroup = ({ storage }: TCreatePartyGroupParams) => {
  const parties = new Map<string, Party>();

  const save = (party: Party): void => {
    const snapshot = party.snapshot();

    storage.saveParty({
      uuid: party.uuid,
      theme: snapshot.theme?.name ?? '',
      state: snapshot as unknown as LucidShared.TState,
    });
  };

  return {
    create: ({ uuid, ownerId }: TCreateParams): Party => {
      const party = new Party({ uuid, ownerId });

      parties.set(uuid, party);
      save(party);

      return party;
    },

    // Партия поднимается из базы только когда её спросили: держать в памяти
    // всё, что когда-либо игралось, незачем
    get: (uuid: string): Party | null => {
      const inMemory = parties.get(uuid);

      if (inMemory) {
        return inMemory;
      }

      const stored = storage.loadParty(uuid) as unknown as TPartySnapshot | null;

      if (!stored) {
        return null;
      }

      const party = Party.fromSnapshot(stored);
      parties.set(uuid, party);

      return party;
    },

    persist: (party: Party): void => save(party),

    remove: (uuid: string): void => {
      parties.delete(uuid);
      storage.removeParty(uuid);
    },
  };
};

export type TPartyGroup = ReturnType<typeof createPartyGroup>;
```

Приведение через `as unknown` нужно потому, что хранилище писалось под состояние движка, а хранит теперь снимок партии целиком. Если это покажется грязным — измени сигнатуры `saveParty` и `loadParty` на обобщённые, но тогда поправь и их тесты.

- [ ] **Шаг 5: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: все тесты зелёные, включая прежние.

- [ ] **Шаг 6: Коммит**

```bash
git add server/src/games/lucid
git commit -m "feat(lucid): добавить набор партий с восстановлением из базы"
```

---

## Задача 11: Сокеты и таблица обработчиков

Слой сокетов держится тонким: он опознаёт игрока при рукопожатии, зовёт методы партии и рассылает виды. Вся логика уже проверена без сети.

Обработчики лежат в таблице, а не россыпью: в соседней игре `init.ts` разросся до 436 строк с тринадцатью одинаковыми блоками `try/catch`, и повторять это не нужно.

**Файлы:**
- Создать: `server/src/games/lucid/i18n/translations/ru.ts`
- Создать: `server/src/games/lucid/init.ts`
- Создать: `server/src/games/lucid/index.ts`
- Создать: `server/src/games/lucid/init.test.ts`

- [ ] **Шаг 1: Написать сообщения**

`server/src/games/lucid/i18n/translations/ru.ts`:

```ts
export const ru = {
  lucid: {
    errors: {
      cannotStart: 'Начать партию пока нельзя',
      emptyNickname: 'Нужно назваться',
      emptyTheme: 'Тема не может быть пустой',
      notAMember: 'Вас нет в этой партии',
      nicknameTaken: 'Такой ник в партии уже занят',
      partyAlreadyStarted: 'Партия уже идёт',
      partyIsFull: 'В партии уже шестеро',
      partyNotFound: 'Партия не найдена',
      themeTooLong: 'Тема слишком длинная',
      unknown: 'Что-то пошло не так',
    },
    ribbon: {
      autopilotMoved: '%{nickname}: ход сделан автоматически, связь потеряна',
      usedFallback: 'Придумать ваш мир не получилось, играем на запасном',
    },
  },
};
```

- [ ] **Шаг 2: Написать падающий тест**

`server/src/games/lucid/init.test.ts`:

```ts
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { createHandlers } from '@/games/lucid/init';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createStorage } from '@/games/lucid/storage/db';

const setup = () => {
  const group = createPartyGroup({ storage: createStorage(':memory:') });
  const party = group.create({ uuid: 'p1', ownerId: 'a' });
  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });

  const broadcast = vi.fn();
  const fail = vi.fn();
  const handlers = createHandlers({ group, broadcast, fail });

  return {
    group,
    party,
    broadcast,
    fail,
    handlers,
  };
};

describe('обработчики', () => {
  it('предложенная тема расходится всем', () => {
    const { handlers, party, broadcast } = setup();

    handlers[LucidShared.ELucidEvent.proposeTheme]({ party, playerId: 'a' }, 'пираты');

    expect(party.view('b').members[0].themeProposal).toBe('пираты');
    expect(broadcast).toHaveBeenCalledWith(party);
  });

  it('пустая тема оборачивается понятной ошибкой', () => {
    const { handlers, party, fail, broadcast } = setup();

    handlers[LucidShared.ELucidEvent.proposeTheme]({ party, playerId: 'a' }, '  ');

    expect(fail).toHaveBeenCalledWith('a', 'Тема не может быть пустой');
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('запустить партию может только владелец', () => {
    const { handlers, party, fail } = setup();

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'b' });

    expect(fail).toHaveBeenCalledWith('b', 'Начать партию пока нельзя');
  });
});
```

- [ ] **Шаг 3: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/init.test.ts`
Ожидается: падение с сообщением о том, что модуль `@/games/lucid/init` не найден.

- [ ] **Шаг 4: Написать обработчики и подключение**

`server/src/games/lucid/init.ts`:

```ts
import type { Namespace, Server } from 'socket.io';

import { LucidShared } from '@trgames/shared';
import { uid } from 'uid';

import type { TPartyGroup } from '@/games/lucid/room/PartyGroup';
import type { Party } from '@/games/lucid/room/Party';

import { generateContent } from '@/games/lucid/generation/pipeline';
import { generateJson } from '@/games/lucid/generation/model';
import { t } from '@/i18n';

// Сколько ждём генерацию, прежде чем сесть за запасную партию
const GENERATION_BUDGET_MS = 90_000;

// Ошибки партии — это коды, а не тексты: перевод живёт в одном месте
const ERROR_MESSAGES: Record<string, string> = {
  'cannot-start': t('lucid.errors.cannotStart', 'ru'),
  'empty-nickname': t('lucid.errors.emptyNickname', 'ru'),
  'empty-theme': t('lucid.errors.emptyTheme', 'ru'),
  'nickname-taken': t('lucid.errors.nicknameTaken', 'ru'),
  'not-a-member': t('lucid.errors.notAMember', 'ru'),
  'party-already-started': t('lucid.errors.partyAlreadyStarted', 'ru'),
  'party-is-full': t('lucid.errors.partyIsFull', 'ru'),
  'theme-too-long': t('lucid.errors.themeTooLong', 'ru'),
};

interface THandlerContext {
  party: Party;
  playerId: LucidShared.TPlayerId;
}

interface TCreateHandlersParams {
  group: TPartyGroup;
  broadcast: (party: Party) => void;
  fail: (playerId: LucidShared.TPlayerId, message: string) => void;
}

export const messageForError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : '';

  return ERROR_MESSAGES[code] ?? t('lucid.errors.unknown', 'ru');
};

export const createHandlers = ({ group, broadcast, fail }: TCreateHandlersParams) => {
  // Обёртка вместо повторяющегося try/catch в каждом обработчике.
  // Сохранение здесь, а не в отдельных обработчиках: иначе партия, которая
  // набрала состав и запустила генерацию, но не получила ни одного хода,
  // не переживёт перезапуск сервера — а забыть вызов легко
  const guard = <TArgs extends unknown[]>(
    handler: (context: THandlerContext, ...args: TArgs) => void,
  ) => (context: THandlerContext, ...args: TArgs): void => {
    try {
      handler(context, ...args);
      group.persist(context.party);
      broadcast(context.party);
    } catch (error) {
      fail(context.playerId, messageForError(error));
    }
  };

  return {
    [LucidShared.ELucidEvent.proposeTheme]: guard(({ party, playerId }, theme: string) => {
      party.proposeTheme(playerId, theme);
    }),

    [LucidShared.ELucidEvent.declineTheme]: guard(({ party, playerId }) => {
      party.declineTheme(playerId);
    }),

    [LucidShared.ELucidEvent.startParty]: guard(({ party, playerId }) => {
      if (playerId !== party.ownerId || !party.canStart) {
        throw new Error('cannot-start');
      }

      void party.start({
        generate: params => generateContent({
          ...params,
          generateJson,
          deadlineMs: Date.now() + GENERATION_BUDGET_MS,
        }),
      }).then(() => {
        if (party.view(playerId).usedFallback) {
          party.addRibbonLine(t('lucid.ribbon.usedFallback', 'ru'));
        }

        // Генерация асинхронна, и обёртка сохранила партию раньше, чем
        // появилось состояние: сохраняем ещё раз, когда оно готово
        group.persist(party);
        broadcast(party);
      });
    }),

    [LucidShared.ELucidEvent.makeMove]: guard(({ party, playerId }, move: LucidShared.TMove) => {
      // Ход всегда приписывается тому, кто его прислал: доверять полю
      // из сообщения нельзя
      const before = party.rawState()?.stateId;

      party.applyMove({ ...move, playerId });

      // Движок при отказе возвращает то же состояние без причины. Игроку её
      // не показывают — интерфейс не даёт нажать невозможное, — но при разборе
      // жалоб «у меня кнопка не работает» она нужна
      if (party.rawState()?.stateId === before) {
        console.warn('lucid: ход отклонён', { partyId: party.uuid, playerId, move });
      }
    }),

    [LucidShared.ELucidEvent.playAgain]: guard(({ party, playerId }) => {
      const next = group.create({ uuid: uid(), ownerId: playerId });

      party.view(playerId).members.forEach(member => {
        next.join({ playerId: member.playerId, nickname: member.nickname });
      });

      party.addRibbonLine(`Новая партия: ${next.uuid}`);
    }),
  };
};

export const init = (io: Server): void => {
  const namespace = io.of('/lucid') as Namespace<
    LucidShared.TLucidClientToServerEvents,
    LucidShared.TLucidServerToClientEvents
  >;

  namespace.on('connection', socket => {
    socket.on('error', error => console.error(error));
  });
};
```

Импорты `createAutopilot` и `chooseAutoMove` в этой задаче не нужны — они появятся в задаче 12 вместе с подключением.

Обработчик хода обращается к `party.rawState()` — этот метод добавляется в задаче 12, шаг 2. Если по порядку выполнения его ещё нет, добавь сейчас, а в задаче 12 пропусти.

**Внимание:** функция `init` здесь намеренно оставлена заготовкой — рукопожатие, привязка сокета к комнате и рассылка делаются в задаче 12. Обработчики выше уже полны и проверены тестом.

`server/src/games/lucid/index.ts`:

```ts
import { init } from '@/games/lucid/init';

export const Lucid = {
  init,
};
```

- [ ] **Шаг 5: Подключить переводы**

В `server/src/i18n/translations/ru.ts` добавить в экспортируемый объект содержимое `lucid` из файла, созданного на шаге 1, — рядом с разделом `cryptoz`. Проверь, как устроен существующий файл, и следуй его структуре.

- [ ] **Шаг 6: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: все тесты зелёные.

- [ ] **Шаг 7: Коммит**

```bash
git add server/src/games/lucid server/src/i18n
git commit -m "feat(lucid): добавить таблицу обработчиков и сообщения"
```

---

## Задача 12: Рукопожатие, комната и рассылка

Последний слой: кто подключился, в какую комнату socket.io он попал и кому что разослать. Комната на партию, а не неймспейс — обоснование в ADR-0008.

**Файлы:**
- Изменить: `server/src/games/lucid/init.ts`
- Изменить: `server/src/index.ts`

- [ ] **Шаг 1: Дописать подключение**

Ключевое в этом шаге — **когда просыпается автопилот**. Он реагирует не на обрыв связи, а на то, чей сейчас ход: после каждой рассылки проверяем, на связи ли ходящий игрок, и либо заводим один таймер, либо снимаем его.

Так оба очевидных способа ошибиться закрыты по построению. Автопилот, заведённый «на обрыв связи», сработал бы не в свой ход — при трёх игроках это обычный случай, — движок отклонил бы такой ход, и никто не завёл бы таймер заново: партия зависла бы навсегда в ожидании хода, которого некому сделать. А один автопилот на партию вместо одного на подключение означает, что вернувшийся игрок действительно отменяет свой таймер, а не создаёт новый пустой объект.

Заменить заготовку `init` в `server/src/games/lucid/init.ts` на полную версию:

```ts
export const init = (io: Server): void => {
  const namespace = io.of('/lucid') as Namespace<
    LucidShared.TLucidClientToServerEvents,
    LucidShared.TLucidServerToClientEvents
  >;
  const group = createPartyGroup({ storage: createStorage(STORAGE_PATH) });
  // Один автопилот на партию, а не на подключение: иначе таймер, заведённый
  // прежним соединением, остался бы в объекте, до которого новое не дотянется
  const autopilots = new Map<string, TAutopilot>();

  const fail = (playerId: LucidShared.TPlayerId, message: string): void => {
    namespace.to(`player:${playerId}`).emit(LucidShared.ELucidEvent.showError, { message });
  };

  // Объявлено заранее: рассылка вызывает проверку автопилота, а та после
  // автоматического хода снова вызывает рассылку
  let broadcast: (party: Party) => void;

  const autopilotFor = (party: Party): TAutopilot => {
    const existing = autopilots.get(party.uuid);

    if (existing) {
      return existing;
    }

    const created = createAutopilot({
      play: absentId => {
        const state = party.rawState();

        if (!state) {
          return;
        }

        const move = chooseAutoMove(state);

        if (!move) {
          return;
        }

        const before = state.stateId;

        party.applyMove({ ...move, playerId: absentId });

        // Строка в ленту только если ход действительно применился: иначе
        // игроки прочитали бы про ход, которого не было
        if (party.rawState()?.stateId !== before) {
          party.addRibbonLine(t('lucid.ribbon.autopilotMoved', 'ru', {
            nickname: party.nicknameOf(absentId),
          }));
        }

        group.persist(party);
        broadcast(party);
      },
    });

    autopilots.set(party.uuid, created);

    return created;
  };

  // Автопилот нужен ровно тогда, когда ходить должен тот, кого нет на связи.
  // Проверка после каждой рассылки заодно перевзводит таймер сама: сходил
  // автопилот — состояние изменилось — проверили снова
  const syncAutopilot = (party: Party): void => {
    const autopilot = autopilotFor(party);
    const state = party.rawState();

    autopilot.stop();

    if (!state || state.ctx.phase === LucidShared.EPhase.ENDED) {
      autopilots.delete(party.uuid);

      return;
    }

    if (!party.isConnected(state.ctx.currentPlayer)) {
      autopilot.schedule(state.ctx.currentPlayer);
    }
  };

  // Каждому свой вид: непройденные клетки не должны уехать игроку
  broadcast = (party: Party): void => {
    party.view(party.ownerId).members.forEach(member => {
      namespace
        .to(`player:${member.playerId}`)
        .emit(LucidShared.ELucidEvent.updateParty, party.view(member.playerId));
    });

    const delta = party.takeRibbonDelta();

    if (delta.length > 0) {
      namespace.to(party.uuid).emit(LucidShared.ELucidEvent.appendRibbon, delta);
    }

    syncAutopilot(party);
  };

  const handlers = createHandlers({ group, broadcast: party => broadcast(party), fail });

  namespace.use((socket, next) => {
    const { partyId, playerId, nickname } = socket.handshake.query;

    if (typeof partyId !== 'string' || typeof playerId !== 'string'
      || typeof nickname !== 'string') {
      next(new Error(t('lucid.errors.partyNotFound', 'ru')));

      return;
    }

    const party = group.get(partyId);

    if (!party) {
      next(new Error(t('lucid.errors.partyNotFound', 'ru')));

      return;
    }

    try {
      party.join({ playerId, nickname });
      next();
    } catch (error) {
      next(new Error(messageForError(error)));
    }
  });

  namespace.on('connection', socket => {
    const partyId = socket.handshake.query.partyId as string;
    const playerId = socket.handshake.query.playerId as string;
    const party = group.get(partyId)!;
    const context = { party, playerId };

    // Две комнаты: одна на партию для общих сообщений, одна на игрока —
    // чтобы личный вид уехал только ему
    void socket.join(party.uuid);
    void socket.join(`player:${playerId}`);

    group.persist(party);
    broadcast(party);

    socket.on(LucidShared.ELucidEvent.proposeTheme, theme => {
      handlers[LucidShared.ELucidEvent.proposeTheme](context, theme);
    });
    socket.on(LucidShared.ELucidEvent.declineTheme, () => {
      handlers[LucidShared.ELucidEvent.declineTheme](context);
    });
    socket.on(LucidShared.ELucidEvent.startParty, () => {
      handlers[LucidShared.ELucidEvent.startParty](context);
    });
    socket.on(LucidShared.ELucidEvent.makeMove, move => {
      handlers[LucidShared.ELucidEvent.makeMove](context, move);
    });
    socket.on(LucidShared.ELucidEvent.playAgain, () => {
      handlers[LucidShared.ELucidEvent.playAgain](context);
    });

    socket.on('disconnect', () => {
      party.disconnect(playerId);
      // Заводить таймер здесь не нужно: рассылка сама решит, нужен ли он
      broadcast(party);
    });

    socket.on('error', error => console.error(error));
  });
};
```

Добавить в начало файла недостающие импорты (`createPartyGroup`, `createStorage`, `createAutopilot`, тип `TAutopilot`, `chooseAutoMove`, тип `Party`) и константу пути к базе:

```ts
// В тестах база живёт в памяти, в бою — файлом рядом с сервером
const STORAGE_PATH = process.env.LUCID_DB_PATH ?? 'lucid.db';
```

- [ ] **Шаг 2: Дописать недостающие методы партии**

В `server/src/games/lucid/room/Party.ts` добавить:

```ts
  // Полное состояние нужно автопилоту: он выбирает ход по тому же состоянию,
  // по которому его проверяет движок
  public rawState = (): LucidShared.TState | undefined => this.state;

  public nicknameOf = (playerId: LucidShared.TPlayerId): string => {
    return this.members.get(playerId)?.nickname ?? '';
  };

  // Нужен проверке автопилота: ходит ли сейчас тот, кого нет на связи
  public isConnected = (playerId: LucidShared.TPlayerId): boolean => {
    return this.members.get(playerId)?.isConnected ?? false;
  };
```

- [ ] **Шаг 3: Подключить игру к серверу**

В `server/src/index.ts` добавить импорт и вызов рядом с существующим `Cryptoz.init(io)`:

```ts
import { Lucid } from '@/games/lucid';
```

```ts
Lucid.init(io);
```

- [ ] **Шаг 4: Проверка**

Выполнить: `yarn workspace @trgames/server lint`
Ожидается: проверка типов, линтер и все тесты проходят.

- [ ] **Шаг 5: Коммит**

```bash
git add server/src/games/lucid server/src/index.ts
git commit -m "feat(lucid): подключить партию к сокетам и серверу"
```

---

## Задача 13: Создание партии

Рукопожатие требует существующий идентификатор партии, поэтому создать первую партию через него нельзя — курица и яйцо. Нужна отдельная точка входа, как в соседней игре, где общий неймспейс игры отвечает за создание комнат.

Это два **статичных** неймспейса, а не неймспейс на партию: ADR-0008 запрещает второе, а не первое.

**Файлы:**
- Изменить: `tools/shared/src/games/lucid/types/socket.ts`
- Изменить: `server/src/games/lucid/init.ts`
- Изменить: `server/src/games/lucid/init.test.ts`

- [ ] **Шаг 1: Добавить событие создания**

В `tools/shared/src/games/lucid/types/socket.ts` добавить в перечисление:

```ts
  createParty = 'create-party',
```

И новые карты событий для общего неймспейса:

```ts
export interface TLucidLobbyClientToServerEvents {
  [ELucidEvent.createParty]: (
    callback: (result: { status: 'ok'; partyId: string } | { status: 'error'; message: string }) => void
  ) => void;
}

export interface TLucidLobbyServerToClientEvents {
  [ELucidEvent.showError]: (params: { message: string }) => void;
}
```

Создание партии отвечает **обратным вызовом**, а не рассылкой: создателю нужен идентификатор, чтобы тут же подключиться к партии и получить ссылку для друзей.

- [ ] **Шаг 2: Написать падающий тест**

Добавить в `server/src/games/lucid/init.test.ts`:

```ts
describe('создание партии', () => {
  it('создаёт партию и возвращает её идентификатор', () => {
    const group = createPartyGroup({ storage: createStorage(':memory:') });
    const callback = vi.fn();

    createParty({ group }, callback);

    const [result] = callback.mock.calls[0] as [{ status: string; partyId: string }];

    expect(result.status).toBe('ok');
    expect(group.get(result.partyId)).not.toBeNull();
  });

  it('создатель становится владельцем только после входа', () => {
    const group = createPartyGroup({ storage: createStorage(':memory:') });
    const callback = vi.fn();

    createParty({ group }, callback);

    const [result] = callback.mock.calls[0] as [{ partyId: string }];
    const party = group.get(result.partyId)!;

    // Владелец назначается при создании, но состав пуст, пока он не подключился
    expect(party.view(party.ownerId).members).toHaveLength(0);
  });
});
```

Импорт `createParty` добавить к существующим.

- [ ] **Шаг 3: Запустить тест и убедиться, что он падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/init.test.ts`
Ожидается: падение, потому что `createParty` не существует.

- [ ] **Шаг 4: Написать реализацию**

Тут возникает вопрос, кто владелец партии, которой ещё никто не создал состав. Создатель сообщает свой идентификатор при создании — он у него уже есть, потому что выдаётся браузером при первом заходе.

В `server/src/games/lucid/init.ts` добавить:

```ts
interface TCreatePartyContext {
  group: TPartyGroup;
  ownerId: LucidShared.TPlayerId;
}

type TCreatePartyCallback = (
  result: { status: 'ok'; partyId: string } | { status: 'error'; message: string },
) => void;

export const createParty = (
  { group, ownerId }: TCreatePartyContext,
  callback: TCreatePartyCallback,
): void => {
  try {
    const party = group.create({ uuid: uid(), ownerId });

    callback({ status: 'ok', partyId: party.uuid });
  } catch (error) {
    callback({ status: 'error', message: messageForError(error) });
  }
};
```

В тесте из шага 2 контекст передаётся без `ownerId` — поправь тест, добавив `ownerId: 'a'`, и проверь, что владельцем назначен именно он.

- [ ] **Шаг 5: Подключить общий неймспейс**

В `init` (полную версию из задачи 12) добавить перед объявлением неймспейса партии:

```ts
  // Общий неймспейс игры: единственное, что он умеет, — создать партию.
  // Через неймспейс партии это невозможно, потому что рукопожатие там
  // требует уже существующий идентификатор
  const lobby = io.of('/lucid/lobby') as Namespace<
    LucidShared.TLucidLobbyClientToServerEvents,
    LucidShared.TLucidLobbyServerToClientEvents
  >;

  lobby.on('connection', socket => {
    const ownerId = socket.handshake.query.playerId;

    socket.on(LucidShared.ELucidEvent.createParty, callback => {
      if (typeof ownerId !== 'string') {
        callback({ status: 'error', message: t('lucid.errors.unknown', 'ru') });

        return;
      }

      createParty({ group, ownerId }, callback);
    });

    socket.on('error', error => console.error(error));
  });
```

- [ ] **Шаг 6: Проверка**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: все тесты зелёные.

- [ ] **Шаг 7: Коммит**

```bash
git add tools/shared/src/games/lucid server/src/games/lucid
git commit -m "feat(lucid): добавить создание партии"
```

---

## Задача 14: Партия целиком через комнату

Сквозная проверка: от пустого лобби до победителя, без сети, на подменённой генерации.

**Файлы:**
- Создать: `server/src/games/lucid/room/party.integration.test.ts`

- [ ] **Шаг 1: Написать тест**

`server/src/games/lucid/room/party.integration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LucidShared } from '@trgames/shared';

import { chooseAutoMove } from '@/games/lucid/core/autoMove';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createStorage } from '@/games/lucid/storage/db';
import { eventCellIds } from '@/games/lucid/core/track';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';

const MAX_MOVES = 2000;

const playToEnd = (party: ReturnType<ReturnType<typeof createPartyGroup>['create']>) => {
  for (let i = 0; i < MAX_MOVES; i++) {
    const state = party.rawState();

    if (!state || state.ctx.phase === LucidShared.EPhase.ENDED) {
      return;
    }

    const move = chooseAutoMove(state);

    if (!move) {
      return;
    }

    party.applyMove(move);
  }
};

describe('партия через комнату', () => {
  const makeGroup = () => createPartyGroup({ storage: createStorage(':memory:') });

  const readyParty = (group: ReturnType<typeof makeGroup>, uuid: string, playerCount: number) => {
    const party = group.create({ uuid, ownerId: 'p0' });

    for (let index = 0; index < playerCount; index++) {
      party.join({ playerId: `p${index}`, nickname: `Игрок ${index}` });
    }

    party.proposeTheme('p0', 'заброшенная станция');

    return party;
  };

  it('от лобби до победителя при любом составе', async () => {
    for (const playerCount of [2, 3, 4, 5, 6]) {
      const group = makeGroup();
      const party = readyParty(group, `full-${playerCount}`, playerCount);

      await party.start({
        generate: async ({ eventCellIds: cells, seed }) => ({
          content: loadFallbackContent(cells, seed),
          usedFallback: true,
        }),
      });

      playToEnd(party);

      expect(party.view('p0').phase).toBe(LucidShared.EPartyPhase.ENDED);
      expect(party.rawState()?.G.winner).toBeDefined();
    }
  });

  it('игрок не видит содержимого непройденных клеток', async () => {
    const group = makeGroup();
    const party = readyParty(group, 'secrets', 3);

    await party.start({
      generate: async ({ eventCellIds: cells, seed }) => ({
        content: loadFallbackContent(cells, seed),
        usedFallback: true,
      }),
    });

    expect(Object.keys(party.view('p0').state!.G.events)).toHaveLength(0);
  });

  it('партия продолжается после перезапуска сервера', async () => {
    const storage = createStorage(':memory:');
    const group = createPartyGroup({ storage });
    const party = readyParty(group, 'restart', 3);

    await party.start({
      generate: async ({ eventCellIds: cells, seed }) => ({
        content: loadFallbackContent(cells, seed),
        usedFallback: true,
      }),
    });

    const state = party.rawState()!;
    party.applyMove(chooseAutoMove(state)!);
    group.persist(party);

    const restored = createPartyGroup({ storage }).get('restart')!;
    playToEnd(restored);

    expect(restored.view('p0').phase).toBe(LucidShared.EPartyPhase.ENDED);
  });

  it('номера клеток событий совпадают с треком партии', async () => {
    const group = makeGroup();
    const party = readyParty(group, 'cells', 4);
    let requested: number[] = [];

    await party.start({
      generate: async ({ eventCellIds: cells, seed }) => {
        requested = cells;

        return { content: loadFallbackContent(cells, seed), usedFallback: true };
      },
    });

    expect(requested).toEqual(eventCellIds(party.rawState()!.G.track));
  });
});
```

- [ ] **Шаг 2: Запустить тест**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/room/party.integration.test.ts`
Ожидается: все четыре теста зелёные.

Если партия не доходит до победителя — это дефект комнаты или движка, а не теста. Не увеличивай `MAX_MOVES` и не сужай перебор составов: остановись и разберись, в какой фазе и на какой клетке всё встало.

- [ ] **Шаг 3: Прогнать весь репозиторий**

Выполнить: `yarn lint`
Ожидается: все три воркспейса проходят.

- [ ] **Шаг 4: Коммит**

```bash
git add server/src/games/lucid
git commit -m "test(lucid): добавить сквозной тест партии через комнату"
```

---

## Что этот план сознательно не делает

- **Интерфейс.** Экраны, поле, карточка события, звук — отдельный план. К его началу партия уже играется по сети.
- **Список игр TRGames.** Подключение lucid к `GamesPage` и `GameThemeProvider` — часть клиентского плана, потому что это клиентские файлы.
- **Публичный доступ.** Учётные записи, ограничение частоты, модерация тем — по ADR-0005 откладываются до того, как игра приживётся.
- **Слепки партий.** Короткий код для повтора понравившейся генерации. Хранилище под них готово.
- **Итоги партии.** Кто сколько потратил, у кого был худший бросок — считать не из чего, полной истории нет (см. «Конец партии» в CONTEXT.md).
- **Удаление умерших партий.** Партия живёт один вечер, но автоматической уборки старых записей из базы в этом плане нет. Появится, когда станет видно, сколько их накапливается.

---

## Задача 15: Обобщить хранилище по типу документа

Решение от 2026-09-22, обоснование в `docs/lucid/OPEN-QUESTIONS.md`.

`saveParty` и `loadParty` типизированы через состояние движка, но хранят снимок партии целиком, поэтому в задаче 10 стоит приведение `as unknown`. В этом месте компилятор перестал проверять путь восстановления сорокаминутной партии — ровно тот класс дефекта, на котором уже обжигались в фильтрации состояния под игрока.

**Что сделать:** сделать `saveParty` и `loadParty` обобщёнными по типу документа, убрать оба приведения из `PartyGroup.ts`, поправить тесты хранилища. Отдельную таблицу для комнат не заводить: вид документа один, вторая таблица окупится только с появлением третьего.

Проверка: `yarn workspace @trgames/server test --run src/games/lucid` — все тесты зелёные, приведений `as unknown` в `PartyGroup.ts` не осталось.

## Задача 16: Добавить теме поле настроения

Решение от 2026-09-22. Поле решает две задачи сразу: светлая партия или тёмная по палитре и какая играет музыка.

**Что сделать:** необязательное перечисление с двумя значениями (светлое и тёмное) в схеме мира `server/src/games/lucid/generation/schema.ts`; строка в промпте мира, объясняющая, когда какое выбирать; тест, что схема принимает тему и с полем, и без него. Значения выбирать расширяемо: добавить третье потом можно, выбросить лишнее уже нет.

Запасную партию не трогать: поле необязательное, отсутствие значения обрабатывается на клиенте.

## Задача 17: Удалять опустевшие партии

Решение от 2026-09-22. Сейчас партии не удаляются никогда — ни из памяти, ни из базы, хотя `CONTEXT.md` описывает обратное.

**Что сделать:** партия удаляется, когда не осталось подключённых **и** прошла отсрочка. Отсчёт от момента, когда партия опустела, а не от создания: так одно правило покрывает и сорокаминутную партию, и лобби, куда никто не зашёл.

Отсрочку взять с заметным запасом к окну автопилота в тридцать секунд, иначе партия умрёт у четверых, одновременно обновивших вкладку.

Тест: партия с отключившимися всеми участниками не удаляется сразу, удаляется после отсрочки, а вернувшийся до её истечения игрок отсрочку снимает.

Привести `CONTEXT.md` в соответствие: сейчас там описано поведение, которого в коде не было.
