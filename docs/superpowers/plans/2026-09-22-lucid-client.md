# План реализации: клиент игры lucid

> **Для исполнителей:** обязательный под-навык — `superpowers:subagent-driven-development` (рекомендуется) либо `superpowers:executing-plans`. Шаги помечены чекбоксами `- [ ]`.

**Цель:** играбельный интерфейс lucid — от создания партии по ссылке до победителя, с оформлением, которое задаёт сгенерированная тема, и со звуком.

**Подход:** тонкий клиент над готовым авторитарным сервером. Клиент ничего не решает про правила: он рисует присланный вид, отправляет ходы и ждёт подтверждения. Оптимистичных ходов нет (`CONTEXT.md`, «Отклонённый ход»). Всё, что специфично для партии — цвет, фон, форма трека — вычисляется из присланной темы и трека, а не подбирается руками.

**Стек:** React 18, MobX, socket.io-client, Tailwind, Radix UI (через существующие `@/components/ui`), SVG для поля, готовые звуки Kenney под CC0, vitest для проверяемых гарантий.

---

## Порядок выполнения

Задачи пронумерованы по смыслу, а выполняются в другом порядке. Причина одна и важная: **поле собирается раньше остальных экранов и показывается заказчику до того, как на нём построят интерфейс.**

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 12 → [показ заказчику] → 8 → 9 → 10 → 11 → 13 → 14 → 15 → 16 → 17
```

Поле — единственный смелый элемент облика, и облик этот заказчик по пунктам не утверждал: `DESIGN.md` написан по его брифу, но не пройден им. Судить о форме трека, шрифтах и фоне словами трудно — про соседнюю игру он понял, что визуал не нравится, увидев её, а не прочитав описание. Поэтому задача 12 заканчивается историей в Storybook на выдуманном треке и палитре: смотреть можно без сервера, без партии и без всего остального клиента.

Переделка поля после показа стоит одной задачи. Переделка поля после того, как поверх него легли полосы, лента и карточка события, — трёх.

---

## Что уже готово на сервере

Ядро и транспорт выполнены и покрыты тестами. Клиент опирается на это и **ничего из этого не переписывает**:

- Неймспейс `/lucid` — рукопожатие по `query: { partyId, playerId, nickname }`, комнаты `<partyId>` и `player:<playerId>`.
- Неймспейс `/lucid/lobby` — рукопожатие по `query: { playerId }`, единственное событие `create-party` с колбэком `{ status: 'ok', partyId } | { status: 'error', message }`.
- События к клиенту: `update-party` (полный вид игрока), `append-ribbon` (только прирост ленты), `show-error` (сообщение лично игроку).
- События от клиента: `propose-theme`, `decline-theme`, `start-party`, `make-move`, `play-again`.
- Типы в `@trgames/shared`, доступны **только через неймспейс**: `LucidShared.TPartyView`, `LucidShared.EPartyPhase`, `LucidShared.TMove`, `LucidShared.EMoveType`, `LucidShared.EPhase`, `LucidShared.TTheme`, `LucidShared.TTrack`, `LucidShared.ECellType`, `LucidShared.TOption`, `LucidShared.TEvent`, `LucidShared.EAtomKind`, `LucidShared.ETarget`.

Плоского реэкспорта (`export { EMoveType } from '@trgames/shared'`) **не существует** — это уже ломало сборку в прошлом плане. Если внутри модуля нужно значение перечисления, пишется `const EMoveType = LucidShared.EMoveType;` и рядом одноимённый `type`.

---

## Конвенции репозитория

- Одинарные кавычки, точки с запятой, 2 пробела, максимум 120 символов, стрелочные функции.
- **Объектные типы — через `interface`.** Через `type` только алиасы, объединения, типы функций и производные типы.
- Импорты: сначала type-импорты, затем по алфавиту — `perfectionist` переставит сам, подчиняйся линтеру.
- 2+ именованных импорта — каждый на своей строке.
- Комментарии в коде и сообщения коммитов — на русском.
- Компоненты — `observer` из `mobx-react-lite`, как во всём клиенте.
- Alias `@/*` → `client/src/*`.
- Перед коммитом: `npx eslint --fix <файлы>` из корня, затем `yarn lint`.
- Pre-commit хук запускает `yarn lint` по всем воркспейсам. **Не отключать флагом `--no-verify`.**
- В конец сообщения коммита **дословно**, отдельной строкой после пустой:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

**Особенность Windows:** не править файлы скриптами на python с записью по умолчанию — перевод строк уедет в виндовый формат и git увидит файл изменённым целиком. Только `newline='\n'`.

---

## Решения, принятые до плана

Записаны здесь, потому что исполнителю они понадобятся раньше, чем он дойдёт до соответствующей задачи. Разбор — в `docs/lucid/OPEN-QUESTIONS.md`.

### Карточка события — полноэкранная, а не у клетки
`DESIGN.md` писался до второго гриллинга и предлагал показывать событие рядом с его клеткой. `CONTEXT.md` («Показ события») фиксирует обратное — полноэкранная карточка, которую нельзя закрыть, но можно свернуть. Источник правды по поведению — `CONTEXT.md`, и выбор там сделан заказчиком явно. `DESIGN.md` приводится в соответствие задачей 1.

### Свой сворачиваемый показ, а не `CollapsibleDialog` из Cryptoz
Механизм в репозитории есть, но он живёт внутри `RoomPage` соседней игры и завязан на её `DialogStore` с очередью разнотипных модалок. В lucid одновременно бывает ровно одна карточка события. Вытаскивать чужой стор в общее место — правка Cryptoz, а её заказчик отложил. Пишем свой показ на ~60 строк.

### Тесты в клиенте: добавляем vitest
`DESIGN.md` требует, чтобы читаемость текста на любой палитре была **проверена тестом**, а не обещана. В клиенте тестов сейчас нет. Уносить цветовую математику в `tools/shared` ради чужого запуска тестов — это инструмент, определяющий архитектуру. Добавляем vitest в воркспейс клиента: один devDependency и один конфиг.

### Аналитики в lucid нет
PostHog в России не работает, заказчик просил его убрать. Из Cryptoz он не вынимается (Cryptoz не трогаем), но в lucid не заводится вовсе: ни `analyticsService.page`, ни `track`.

### Звук: готовые файлы под CC0, подбираю сам
Решено заказчиком 2026-09-22. Синтез WebAudio отпадает: он ничего не стоит, но звучит электронно, а просьба была «чтобы игра живее была, а не просто пиксели менялись».

Звуки действий берутся из паков **Kenney** под CC0 — лицензия разрешает коммерческое использование и не требует указания авторства, а нужные шесть действий закрываются четырьмя паками, включая броски кубика. Если подходящего звука не найдётся, заказчик сделает его сам — тогда недостающее записывается в `OPEN-QUESTIONS.md`, а не подменяется синтезом.

Музыку заказчик выбрал сам и передал двумя файлами; они лежат в `client/src/assets/games/lucid/music/`.

### Значение кубика уезжает игроку отдельным полем
Сейчас выпавшее число существует только внутри строки журнала («Аня выбросил 4»). Разбирать эту строку регулярным выражением, чтобы нарисовать грань кубика, — ровно тот класс дефекта, который в этом проекте уже ловили: работает, пока кто-нибудь не поправит текст. Добавляем в состояние партии явное поле последнего броска (задача 3).

---

## Структура файлов

**Общие типы (`tools/shared/src/games/lucid/types/`)**

| Файл | Что меняется |
|---|---|
| `state.ts` | `TG` получает поле `lastRoll` |
| `content.ts` | `TTheme` получает необязательное `mood` (задача 16 плана транспорта; если та уже выполнена — пропустить) |

**Клиент (`client/src/routes/games/lucid/`)**

| Файл | Ответственность |
|---|---|
| `index.tsx` | Описание маршрутов игры |
| `RootLayout/index.tsx` | Общая обёртка: тема партии, шрифты |
| `LobbyPage/index.tsx` | Создание партии по кнопке, разбор ссылки |
| `PartyPage/index.tsx` | Экран партии: подключение, выбор экрана по фазе |
| `PartyPage/stores/PartyStore.ts` | Вид партии, лента, состояние связи |
| `PartyPage/services/SocketService.ts` | Одно соединение, подписки, отправка ходов |
| `PartyPage/components/Lobby/` | Состав, предложение темы, запуск |
| `PartyPage/components/Generating/` | Раскрытие: мир, трек, наполнение |
| `PartyPage/components/Board/` | Поле: раскладка и отрисовка трека, фишки |
| `PartyPage/components/EventCard/` | Полноэкранная карточка события со сворачиванием |
| `PartyPage/components/Ribbon/` | Лента последних строк |
| `PartyPage/components/Hud/` | Верхняя и нижняя полосы: мир, ресурс, кубик, громкость |
| `PartyPage/components/Ending/` | Победитель и «сыграть ещё» |

**Общее для клиента (`client/src/`)**

| Файл | Ответственность |
|---|---|
| `lib/lucid/colors.ts` | OKLCH, контраст, вывод ролей из палитры |
| `lib/lucid/colors.test.ts` | Гарантия читаемости на недружественных палитрах |
| `lib/lucid/trackLayout.ts` | Укладка графа трека змейкой |
| `lib/lucid/trackLayout.test.ts` | Укладка не теряет клеток и не рвёт связи |
| `lib/lucid/texture.ts` | Процедурная текстура фона из палитры и названия мира |
| `services/LucidSoundService.ts` | Звуки действий и музыка |
| `hooks/usePlayerId.ts` | Анонимный идентификатор игрока |
| `stores/SettingsStore.ts` | Громкость в разделе `general` |
| `lib/constants.ts` | Адрес неймспейса lucid |

Правило импортов прежнее: внутри модуля файлы импортируют друг друга напрямую.

---

## Задача 1: Привести документы в соответствие

Расхождение между двумя документами обнаружится исполнителем в самый неудобный момент — когда он будет верстать показ события. Закрываем заранее.

**Файлы:**
- Изменить: `docs/lucid/DESIGN.md`
- Изменить: `docs/lucid/OPEN-QUESTIONS.md`

- [ ] **Шаг 1: Исправить раздел «Поле» в DESIGN.md**

Найти абзац, начинающийся со слов «Событие показывается **рядом со своей клеткой**», и заменить его целиком на:

```markdown
Событие показывается полноэкранной карточкой, которую нельзя закрыть, но можно
свернуть (`CONTEXT.md`, «Показ события»). Первоначальный набросок предлагал
показывать событие у самой клетки, чтобы игрок видел поле, читая текст; на
гриллинге заказчик выбрал полный экран со сворачиванием — текст события до
четырёхсот знаков не помещается в панель, не съев поле. Потребность видеть
поле закрыта именно сворачиванием. Порог кубика в варианте выбора — часть
текста варианта, а не сноска: решение принимается по нему.
```

- [ ] **Шаг 2: Записать решения по клиенту в OPEN-QUESTIONS.md**

В раздел «Решения, принятые самостоятельно», перед строкой `*(пополняется по ходу работы)*`, добавить четыре записи — со своим текстом, по смыслу из раздела «Решения, принятые до плана» этого плана: свой сворачиваемый показ вместо `CollapsibleDialog` из Cryptoz; vitest в клиенте; отсутствие аналитики в lucid; значение кубика отдельным полем.

И пятую запись — о звуке:

```markdown
### Звуки берутся готовыми, под лицензией CC0
Решено 2026-09-22. Синтезировать звуки через WebAudio было бы бесплатно и не
потребовало бы ни одного файла, но звучит это электронным пиликаньем, а просьба
была «чтобы игра живее была, а не просто пиксели менялись» — синтез решает её
наполовину.

Берём паки Kenney под CC0: лицензия разрешает коммерческое использование и не
требует указания авторства, а все шесть озвучиваемых действий закрываются
четырьмя паками, включая броски кубика.

Если подходящего звука в паках не найдётся, заказчик сделает его сам. Подменять
недостающее синтезом молча нельзя — недостающее записывается сюда.

Музыку заказчик выбрал сам: две дорожки лежат в
`client/src/assets/games/lucid/music/`. Весят они 4.3 и 4.7 МБ — много для
телефона, поэтому грузятся лениво и по одной, когда настроение темы уже
известно. Если на проверке окажется, что это задерживает первый ход, решение
пережать — за заказчиком: файлы его.
```

- [ ] **Шаг 3: Коммит**

```bash
git add docs/lucid
git commit -m "docs(lucid): согласовать показ события и записать решения по клиенту"
```

---

## Задача 2: Тесты в клиенте

Без запуска тестов гарантию читаемости негде проверить, а она — условие играбельности, а не украшение.

**Файлы:**
- Создать: `client/vitest.config.mts`
- Изменить: `client/package.json`

- [ ] **Шаг 1: Добавить зависимость**

Выполнить из корня: `yarn workspace @trgames/client add -D vitest@^3.2.4`

- [ ] **Шаг 2: Написать конфиг**

`client/vitest.config.mts` — повторяет серверный, но без `setupFiles` (мокать нечего) и с окружением `node`: всё тестируемое здесь — чистые функции, DOM не нужен.

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    reporters: 'dot',
    root: './',
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Шаг 3: Добавить скрипты**

В `client/package.json` в раздел `scripts` добавить две строки и дописать запуск тестов в `lint`:

```json
    "test": "vitest --config vitest.config.mts -w=false --silent",
    "test:watch": "vitest --config vitest.config.mts",
    "lint": "yarn typecheck && yarn eslint && yarn stylelint && yarn test",
```

Флаг `--run` при запуске одного файла обязателен и здесь, по той же причине, что на сервере: без него путь приклеивается к `--silent`.

- [ ] **Шаг 4: Проверить, что запускается**

Выполнить: `yarn workspace @trgames/client test`
Ожидается: vitest отрабатывает и сообщает `No test files found` — это успех, файлов пока нет. Команда не должна падать с ошибкой конфигурации.

- [ ] **Шаг 5: Коммит**

```bash
git add client/package.json client/vitest.config.mts yarn.lock
git commit -m "chore(client): подключить vitest"
```

---

## Задача 3: Значение кубика в состоянии партии

Клиенту нужна выпавшая грань, чтобы нарисовать кубик и озвучить бросок. Сейчас число живёт только внутри строки журнала.

**Файлы:**
- Изменить: `tools/shared/src/games/lucid/types/state.ts`
- Изменить: `server/src/games/lucid/core/moves.ts`
- Изменить: `server/src/games/lucid/core/options.ts`
- Изменить: `server/src/games/lucid/core/formatForPlayer.ts`
- Изменить: `server/src/games/lucid/core/formatForPlayer.test.ts`
- Изменить: `server/src/games/lucid/core/moves.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

В `server/src/games/lucid/core/moves.test.ts` добавить внутрь существующего `describe` про `rollAndMove`:

```ts
  it('запоминает выпавшую грань', () => {
    const G = makeG({ players: { p1: { position: 0 } } });
    const after = rollAndMove(G, 'p1');

    expect(after.lastRoll).toEqual({ playerId: 'p1', value: expect.any(Number) });
    expect(after.lastRoll!.value).toBeGreaterThanOrEqual(1);
    expect(after.lastRoll!.value).toBeLessThanOrEqual(6);
  });
```

Если фабрика `makeG` вызывается в этом файле иначе — повтори вызов в том виде, в каком он уже используется в соседних тестах файла.

- [ ] **Шаг 2: Запустить и убедиться, что падает**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid/core/moves.test.ts`
Ожидается: падение с ошибкой типа — поля `lastRoll` в `TG` нет.

- [ ] **Шаг 3: Добавить поле в общие типы**

В `tools/shared/src/games/lucid/types/state.ts` добавить перед `TG`:

```ts
// Последний бросок кубика в партии. Нужен клиенту, чтобы нарисовать грань и
// озвучить бросок. Разбирать строку журнала регулярным выражением нельзя:
// текст журнала предназначен человеку и меняется свободно
export interface TRoll {
  playerId: TPlayerId;
  value: number;
  // Есть, если бросок был проверкой варианта события, а не броском на движение
  threshold?: number;
}
```

И в `TG` рядом с `pendingSteps`:

```ts
  lastRoll?: TRoll;
```

- [ ] **Шаг 4: Заполнять поле при броске на движение**

В `server/src/games/lucid/core/moves.ts` заменить тело `rollAndMove` на:

```ts
export const rollAndMove = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
): LucidShared.TG => {
  const roll = rollDie(G.random);
  const player = G.players[playerId];
  const moved = applyWalk(
    { ...G, random: roll.state, lastRoll: { playerId, value: roll.value } },
    playerId,
    walkForward(G.track, player.position, roll.value),
  );

  return { ...moved, log: [...moved.log, `${player.nickname} выбросил ${roll.value}`] };
};
```

- [ ] **Шаг 5: Заполнять поле при проверке варианта**

В `server/src/games/lucid/core/options.ts` в объект `withRoll` добавить строку рядом с `random`:

```ts
    lastRoll: { playerId: actorId, value: roll.value, threshold: option.threshold },
```

- [ ] **Шаг 6: Пропустить поле игроку**

В `server/src/games/lucid/core/formatForPlayer.ts` добавить в список разрешённого, после `pendingSteps`:

```ts
    lastRoll: state.G.lastRoll,
```

Список полей там перечислен поимённо намеренно — это список разрешённого, а не запрещённого. Новое поле не уезжает игроку само.

- [ ] **Шаг 7: Проверить, что поле действительно доходит**

В `server/src/games/lucid/core/formatForPlayer.test.ts` добавить:

```ts
  it('отдаёт последний бросок', () => {
    const state = makeState({ lastRoll: { playerId: 'p1', value: 4 } });

    expect(formatForPlayer(state, 'p1').G.lastRoll).toEqual({ playerId: 'p1', value: 4 });
  });
```

Вызов фабрики состояния повтори в том виде, в каком он уже используется в этом файле.

- [ ] **Шаг 8: Прогнать тесты игры**

Выполнить: `yarn workspace @trgames/server test --run src/games/lucid`
Ожидается: всё зелёное.

- [ ] **Шаг 9: Коммит**

```bash
git add tools/shared server/src/games/lucid
git commit -m "feat(lucid): сохранять выпавшую грань кубика в состоянии партии"
```

---

## Задача 4: Роли цвета из палитры

Главная задача оформления: палитру задаёт нейросеть, а читаемость обязана сохраниться на любой. Модель легко вернёт пять почти одинаковых серо-бурых оттенков, и на них пропадёт текст.

**Файлы:**
- Создать: `client/src/lib/lucid/colors.ts`
- Создать: `client/src/lib/lucid/colors.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

`client/src/lib/lucid/colors.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  contrastRatio,
  deriveRoles,
  parseHex,
} from '@/lib/lucid/colors';

// Палитры, на которых наивный подбор ломается. Модель вернёт такое рано или поздно
const hostile: Record<string, string[]> = {
  'одинаковые цвета': ['#7a6f63', '#7a6f63', '#7a6f63'],
  'почти одинаковые': ['#7a6f63', '#7b7064', '#796e62', '#7a7165'],
  'только чёрные': ['#000000', '#050505', '#0a0a0a'],
  'только белые': ['#ffffff', '#fefefe', '#fafafa'],
  'кислотные': ['#00ff00', '#ff00ff', '#00ffff', '#ffff00'],
  'три цвета': ['#1b2a41', '#c0a080', '#e4e9f0'],
  'шесть цветов': ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd', '#f4a259'],
  'серая середина': ['#7f7f7f', '#808080', '#818181'],
};

describe('роли цвета', () => {
  Object.entries(hostile).forEach(([name, palette]) => {
    it(`держит читаемость: ${name}`, () => {
      const roles = deriveRoles(palette);
      const base = parseHex(roles.base)!;

      expect(contrastRatio(parseHex(roles.text)!, base)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(parseHex(roles.accent)!, base)).toBeGreaterThanOrEqual(3);
    });
  });

  it('держит читаемость на пустой палитре', () => {
    const roles = deriveRoles([]);
    const base = parseHex(roles.base)!;

    expect(contrastRatio(parseHex(roles.text)!, base)).toBeGreaterThanOrEqual(4.5);
  });

  it('пропускает мусор в палитре', () => {
    const roles = deriveRoles(['не цвет', '#1b2a41', '', '#e4e9f0']);

    expect(parseHex(roles.base)).not.toBeNull();
  });

  it('тёмная тема берёт тёмную основу, светлая — светлую', () => {
    const palette = ['#0d1b2a', '#778da9', '#f4f4f5'];

    expect(deriveRoles(palette, 'DARK').base.toLowerCase()).toBe('#0d1b2a');
    expect(deriveRoles(palette, 'LIGHT').base.toLowerCase()).toBe('#f4f4f5');
  });

  it('без указания настроения решает средняя светлота', () => {
    expect(deriveRoles(['#0d1b2a', '#1b263b', '#415a77']).isDark).toBe(true);
    expect(deriveRoles(['#f4f4f5', '#e4e9f0', '#c0a080']).isDark).toBe(false);
  });

  it('опоры не пусты', () => {
    expect(deriveRoles(['#0d1b2a', '#778da9', '#f4a259']).supports.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Шаг 2: Запустить и убедиться, что падает**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/colors.test.ts`
Ожидается: падение — модуля нет.

- [ ] **Шаг 3: Написать модуль**

`client/src/lib/lucid/colors.ts`. Расчёты ведутся в OKLCH: в нём сдвиг светлоты предсказуем и не уводит цвет в грязь, в отличие от HSL. Контраст считается по яркости sRGB, как того требует WCAG, — это разные пространства, и смешивать их нельзя.

```ts
export interface TRgb {
  r: number;
  g: number;
  b: number;
}

export interface TOklch {
  l: number;
  c: number;
  h: number;
}

export type TMood = 'DARK' | 'LIGHT';

export interface TThemeRoles {
  // Плоскость, на которой всё лежит
  base: string;
  // Контраст с основой не ниже 4.5:1 — гарантируется вычислением, а не выбором
  text: string;
  // Им обозначается то, что можно нажать. Контраст не ниже 3:1
  accent: string;
  // Остальные цвета: крупные плоскости, линия трека, текстура. Требований нет
  supports: string[];
  isDark: boolean;
}

const BLACK: TRgb = { r: 0, g: 0, b: 0 };
const WHITE: TRgb = { r: 1, g: 1, b: 1 };
// Палитра может прийти пустой или целиком из мусора — играть всё равно надо
const FALLBACK_PALETTE = ['#101014', '#f2f2f7', '#7c5cff'];

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

export const parseHex = (value: string): TRgb | null => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());

  if (!match) {
    return null;
  }

  const digits = match[1].length === 3
    ? match[1].split('').map(digit => digit + digit).join('')
    : match[1];

  return {
    r: parseInt(digits.slice(0, 2), 16) / 255,
    g: parseInt(digits.slice(2, 4), 16) / 255,
    b: parseInt(digits.slice(4, 6), 16) / 255,
  };
};

export const toHex = ({ r, g, b }: TRgb): string => {
  const channel = (value: number): string =>
    Math.round(clamp01(value) * 255).toString(16).padStart(2, '0');

  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

const toLinear = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const fromLinear = (value: number): number =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

const luminance = ({ r, g, b }: TRgb): number =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export const contrastRatio = (first: TRgb, second: TRgb): number => {
  const a = luminance(first);
  const b = luminance(second);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

export const rgbToOklch = (rgb: TRgb): TOklch => {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const labL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const labA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: labL,
    c: Math.hypot(labA, labB),
    h: (Math.atan2(labB, labA) * 180) / Math.PI,
  };
};

export const oklchToRgb = ({ l, c, h }: TOklch): TRgb => {
  const radians = (h * Math.PI) / 180;
  const labA = c * Math.cos(radians);
  const labB = c * Math.sin(radians);

  const lCube = (l + 0.3963377774 * labA + 0.2158037573 * labB) ** 3;
  const mCube = (l - 0.1055613458 * labA - 0.0638541728 * labB) ** 3;
  const sCube = (l - 0.0894841775 * labA - 1.291485548 * labB) ** 3;

  return {
    r: clamp01(fromLinear(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube)),
    g: clamp01(fromLinear(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube)),
    b: clamp01(fromLinear(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube)),
  };
};

// Тон и насыщенность сохраняются, двигается только светлота: текст остаётся
// «из этого мира». Если не хватило и этого, берём чёрный или белый — для любой
// основы один из них даёт не меньше 4.58:1, так что порог достижим всегда
const forceContrast = (color: TRgb, base: TRgb, target: number): TRgb => {
  if (contrastRatio(color, base) >= target) {
    return color;
  }

  const towardsDark = contrastRatio(BLACK, base) > contrastRatio(WHITE, base);
  const source = rgbToOklch(color);

  for (let step = 1; step <= 100; step++) {
    const shifted = oklchToRgb({
      ...source,
      l: clamp01(towardsDark ? source.l - step / 100 : source.l + step / 100),
    });

    if (contrastRatio(shifted, base) >= target) {
      return shifted;
    }
  }

  return towardsDark ? BLACK : WHITE;
};

export const deriveRoles = (palette: string[], mood?: TMood): TThemeRoles => {
  const parsed = palette
    .map(value => ({ hex: value, rgb: parseHex(value) }))
    .filter((entry): entry is { hex: string; rgb: TRgb } => entry.rgb !== null);
  const colors = parsed.length > 0
    ? parsed
    : FALLBACK_PALETTE.map(hex => ({ hex, rgb: parseHex(hex)! }));

  const withOklch = colors.map(entry => ({ ...entry, oklch: rgbToOklch(entry.rgb) }));
  const averageLightness = withOklch
    .reduce((sum, entry) => sum + entry.oklch.l, 0) / withOklch.length;
  const isDark = mood ? mood === 'DARK' : averageLightness < 0.5;

  // Крайний по светлоте цвет: самый тёмный для тёмной партии, самый светлый для светлой
  const baseEntry = withOklch.reduce((best, entry) =>
    (isDark ? entry.oklch.l < best.oklch.l : entry.oklch.l > best.oklch.l) ? entry : best);
  const rest = withOklch.filter(entry => entry !== baseEntry);
  const candidates = rest.length > 0 ? rest : withOklch;

  const readable = candidates.filter(entry => contrastRatio(entry.rgb, baseEntry.rgb) >= 4.5);
  const textSource = readable.length > 0
    ? readable.reduce((best, entry) =>
      contrastRatio(entry.rgb, baseEntry.rgb) > contrastRatio(best.rgb, baseEntry.rgb)
        ? entry
        : best)
    : candidates.reduce((best, entry) => (entry.oklch.c < best.oklch.c ? entry : best));

  const visible = candidates.filter(entry => contrastRatio(entry.rgb, baseEntry.rgb) >= 3);
  const accentSource = (visible.length > 0 ? visible : candidates)
    .reduce((best, entry) => (entry.oklch.c > best.oklch.c ? entry : best));

  const text = toHex(forceContrast(textSource.rgb, baseEntry.rgb, 4.5));
  const accent = toHex(forceContrast(accentSource.rgb, baseEntry.rgb, 3));
  const supports = candidates
    .filter(entry => entry !== textSource && entry !== accentSource)
    .map(entry => entry.hex);

  return {
    base: baseEntry.hex,
    text,
    accent,
    supports: supports.length > 0 ? supports : [accentSource.hex],
    isDark,
  };
};
```

- [ ] **Шаг 4: Запустить тест**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/colors.test.ts`
Ожидается: все тесты зелёные.

Если какой-то из них падает — это **не повод ослабить порог в тесте**. Порог 4.5:1 взят из `DESIGN.md` и является условием играбельности. Чини вывод ролей.

- [ ] **Шаг 5: Коммит**

```bash
git add client/src/lib/lucid
git commit -m "feat(lucid): выводить роли цвета из сгенерированной палитры"
```

---

## Задача 5: Укладка трека змейкой

Трек в 30–50 клеток прямой линией на телефоне выродится в нитку с нечитаемыми точками. Змейкой длинный путь умещают на маленькой доске и настоящие настолки.

**Файлы:**
- Создать: `client/src/lib/lucid/trackLayout.ts`
- Создать: `client/src/lib/lucid/trackLayout.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

`client/src/lib/lucid/trackLayout.test.ts`:

```ts
import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { layoutTrack } from '@/lib/lucid/trackLayout';

const START = 'START' as LucidShared.ECellType;
const EVENT = 'EVENT' as LucidShared.ECellType;
const FINISH = 'FINISH' as LucidShared.ECellType;

// Прямой трек без развилок
const lineTrack = (length: number): LucidShared.TTrack => ({
  cells: Array.from({ length }, (_, id) => ({
    id,
    type: id === 0 ? START : id === length - 1 ? FINISH : EVENT,
    next: id === length - 1 ? [] : [id + 1],
  })),
  startId: 0,
  finishId: length - 1,
});

// Трек с одной развилкой: две ветки по две клетки, сходящиеся в финише
const forkTrack = (): LucidShared.TTrack => ({
  cells: [
    { id: 0, type: START, next: [1] },
    { id: 1, type: EVENT, next: [2, 4] },
    { id: 2, type: EVENT, next: [3] },
    { id: 3, type: EVENT, next: [6] },
    { id: 4, type: EVENT, next: [5] },
    { id: 5, type: EVENT, next: [6] },
    { id: 6, type: FINISH, next: [] },
  ],
  startId: 0,
  finishId: 6,
});

describe('укладка трека', () => {
  it('укладывает все клетки', () => {
    const layout = layoutTrack(lineTrack(30), 8);

    expect(layout.cells).toHaveLength(30);
    expect(Object.keys(layout.byId)).toHaveLength(30);
  });

  it('не ставит две клетки в одну точку', () => {
    const layout = layoutTrack(forkTrack(), 4);
    const points = layout.cells.map(cell => `${cell.x}:${cell.y}`);

    expect(new Set(points).size).toBe(points.length);
  });

  it('ведёт змейку в обратную сторону на нечётных рядах', () => {
    const layout = layoutTrack(lineTrack(10), 4);

    expect(layout.byId[0].col).toBe(0);
    expect(layout.byId[3].col).toBe(3);
    // Пятая клетка уже в следующем ряду и идёт справа налево
    expect(layout.byId[4].row).toBe(1);
    expect(layout.byId[4].col).toBe(3);
  });

  it('разводит ветки развилки по разные стороны линии', () => {
    const layout = layoutTrack(forkTrack(), 8);

    expect(layout.byId[2].strand).not.toBe(layout.byId[4].strand);
    expect(layout.byId[2].depth).toBe(layout.byId[4].depth);
    expect(layout.byId[1].strand).toBe(0);
  });

  it('сводит ветки обратно к общей клетке', () => {
    const layout = layoutTrack(forkTrack(), 8);

    expect(layout.byId[6].strand).toBe(0);
    expect(layout.byId[6].depth).toBe(layout.byId[3].depth + 1);
  });

  it('связи ведут только между соседними по глубине клетками', () => {
    const layout = layoutTrack(forkTrack(), 8);

    layout.links.forEach(link => {
      expect(layout.byId[link.to].depth - layout.byId[link.from].depth).toBe(1);
    });
  });

  it('число рядов растёт при узкой раскладке', () => {
    expect(layoutTrack(lineTrack(30), 4).rows)
      .toBeGreaterThan(layoutTrack(lineTrack(30), 10).rows);
  });
});
```

- [ ] **Шаг 2: Запустить и убедиться, что падает**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/trackLayout.test.ts`
Ожидается: падение — модуля нет.

- [ ] **Шаг 3: Написать модуль**

`client/src/lib/lucid/trackLayout.ts`. Опора на строение трека: развилка — это две ветки равной длины, поэтому расстояние от старта у клетки однозначно и его можно взять за место в цепочке. Арифметика над номерами клеток запрещена — ходим по связям, как и движок.

```ts
import type { LucidShared } from '@trgames/shared';

// Условные единицы: реальный размер задаётся масштабом SVG
export const CELL_STEP = 100;
export const ROW_STEP = 120;
// Насколько прядь развилки отходит от общей линии
export const STRAND_OFFSET = 34;

export interface TLaidCell {
  id: number;
  type: LucidShared.ECellType;
  // Расстояние от старта по связям. У обеих прядей развилки оно одинаковое
  depth: number;
  // Прядь внутри своей глубины: 0 — общая линия, -1 и 1 — ветки развилки
  strand: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface TTrackLink {
  from: number;
  to: number;
}

export interface TTrackLayout {
  cells: TLaidCell[];
  byId: Record<number, TLaidCell>;
  links: TTrackLink[];
  rows: number;
  perRow: number;
  width: number;
  height: number;
}

// Сколько клеток помещается в ряд при данной ширине. На телефоне рядов много
// и они короткие, на десктопе наоборот — макет при этом один
export const cellsPerRow = (widthPx: number): number => {
  const MIN_CELL_PX = 56;

  return Math.min(Math.max(Math.floor(widthPx / MIN_CELL_PX), 4), 12);
};

const depthsFromStart = (track: LucidShared.TTrack): Record<number, number> => {
  const cellById = new Map(track.cells.map(cell => [cell.id, cell]));
  const depths: Record<number, number> = { [track.startId]: 0 };
  const queue = [track.startId];

  while (queue.length > 0) {
    const id = queue.shift()!;

    cellById.get(id)?.next.forEach(nextId => {
      if (depths[nextId] === undefined) {
        depths[nextId] = depths[id] + 1;
        queue.push(nextId);
      }
    });
  }

  return depths;
};

export const layoutTrack = (track: LucidShared.TTrack, perRow: number): TTrackLayout => {
  const depths = depthsFromStart(track);
  const byDepth = new Map<number, LucidShared.TCell[]>();

  track.cells.forEach(cell => {
    const depth = depths[cell.id];

    if (depth === undefined) {
      return;
    }

    byDepth.set(depth, [...(byDepth.get(depth) ?? []), cell]);
  });

  const cells: TLaidCell[] = [];

  byDepth.forEach((group, depth) => {
    const row = Math.floor(depth / perRow);
    const indexInRow = depth % perRow;
    // Нечётные ряды идут справа налево — это и есть змейка
    const col = row % 2 === 0 ? indexInRow : perRow - 1 - indexInRow;
    const sorted = [...group].sort((first, second) => first.id - second.id);

    sorted.forEach((cell, index) => {
      const strand = sorted.length === 1 ? 0 : index === 0 ? -1 : 1;

      cells.push({
        id: cell.id,
        type: cell.type,
        depth,
        strand,
        row,
        col,
        x: col * CELL_STEP + CELL_STEP / 2,
        y: row * ROW_STEP + ROW_STEP / 2 + strand * STRAND_OFFSET,
      });
    });
  });

  const byId = Object.fromEntries(cells.map(cell => [cell.id, cell]));
  const links = track.cells.flatMap(cell =>
    cell.next
      .filter(nextId => byId[nextId] !== undefined && byId[cell.id] !== undefined)
      .map(nextId => ({ from: cell.id, to: nextId })));
  const rows = Math.max(...cells.map(cell => cell.row)) + 1;

  return {
    cells,
    byId,
    links,
    rows,
    perRow,
    width: perRow * CELL_STEP,
    height: rows * ROW_STEP,
  };
};
```

- [ ] **Шаг 4: Запустить тест**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/trackLayout.test.ts`
Ожидается: все тесты зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add client/src/lib/lucid
git commit -m "feat(lucid): уложить трек змейкой с ветками развилок"
```

---

## Задача 6: Фон и переменные темы

Фон принадлежит теме, но делается **одним параметризованным механизмом**: иначе придётся писать оформление под каждый мир, который придумает модель, а их бесконечно много.

**Файлы:**
- Создать: `client/src/lib/lucid/theme.ts`
- Создать: `client/src/lib/lucid/theme.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

`client/src/lib/lucid/theme.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  hashString,
  themeStyle,
} from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';

const roles = deriveRoles(['#0d1b2a', '#415a77', '#e0e1dd', '#f4a259']);

describe('оформление темы', () => {
  it('даёт одинаковый фон одному и тому же миру', () => {
    expect(themeStyle(roles, 'Заброшенная станция'))
      .toEqual(themeStyle(roles, 'Заброшенная станция'));
  });

  it('даёт разный фон разным мирам', () => {
    expect(themeStyle(roles, 'Заброшенная станция').backgroundImage)
      .not.toBe(themeStyle(roles, 'Пираты Карибского моря').backgroundImage);
  });

  it('объявляет переменные ролей', () => {
    const style = themeStyle(roles, 'Заброшенная станция') as Record<string, string>;

    expect(style['--lucid-base']).toBe(roles.base);
    expect(style['--lucid-text']).toBe(roles.text);
    expect(style['--lucid-accent']).toBe(roles.accent);
    expect(style['--lucid-line']).toBeDefined();
  });

  it('устойчив к пустому названию мира', () => {
    expect(() => themeStyle(roles, '')).not.toThrow();
  });
});
```

- [ ] **Шаг 2: Запустить и убедиться, что падает**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/theme.test.ts`
Ожидается: падение — модуля нет.

- [ ] **Шаг 3: Написать модуль**

`client/src/lib/lucid/theme.ts`. Текстура держится в низком контрасте к основе: фон — это воздух вокруг поля, а не второй предмет внимания.

```ts
import type { CSSProperties } from 'react';

import type { TThemeRoles } from '@/lib/lucid/colors';

import { parseHex } from '@/lib/lucid/colors';

// FNV-1a: нужен устойчивый номер из названия мира, чтобы фон одной партии
// не менялся между перерисовками и совпадал у всех игроков
export const hashString = (value: string): number => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
};

const withAlpha = (hex: string, alpha: number): string => {
  const rgb = parseHex(hex);

  if (!rgb) {
    return `rgba(128, 128, 128, ${alpha})`;
  }

  const channel = (value: number): number => Math.round(value * 255);

  return `rgba(${channel(rgb.r)}, ${channel(rgb.g)}, ${channel(rgb.b)}, ${alpha})`;
};

export const themeStyle = (roles: TThemeRoles, worldName: string): CSSProperties => {
  const hash = hashString(worldName);
  // Угол, шаг и плотность выводятся из названия мира: один код, разный
  // результат для каждой партии
  const angle = hash % 180;
  const step = 48 + (hash >> 8) % 96;
  const density = 0.03 + ((hash >> 16) % 5) / 100;

  const weave = roles.supports[0] ?? roles.accent;
  const cross = roles.supports[1] ?? roles.supports[0] ?? roles.accent;
  const lines = [
    `repeating-linear-gradient(${angle}deg, ${withAlpha(weave, density)} 0 1px,`
      + ` transparent 1px ${step}px)`,
    `repeating-linear-gradient(${angle + 90}deg, ${withAlpha(cross, density)} 0 1px,`
      + ` transparent 1px ${step}px)`,
    `radial-gradient(120% 90% at 50% 0%, ${withAlpha(weave, density * 2)} 0%, transparent 70%)`,
  ];

  const variables = {
    '--lucid-base': roles.base,
    '--lucid-text': roles.text,
    '--lucid-accent': roles.accent,
    // Линия трека: опора, если она есть, иначе цвет текста вполсилы
    '--lucid-line': roles.supports[0] ?? withAlpha(roles.text, 0.6),
    '--lucid-muted': withAlpha(roles.text, 0.62),
    '--lucid-veil': withAlpha(roles.base, 0.88),
  };

  return {
    ...variables,
    color: roles.text,
    backgroundColor: roles.base,
    backgroundImage: lines.join(', '),
  } as CSSProperties;
};
```

- [ ] **Шаг 4: Запустить тест**

Выполнить: `yarn workspace @trgames/client test --run src/lib/lucid/theme.test.ts`
Ожидается: все тесты зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add client/src/lib/lucid
git commit -m "feat(lucid): собрать оформление партии из палитры и названия мира"
```

---

## Задача 7: Шрифты

Цвет меняется каждую партию, поэтому опознаваемость игры держится на типографике и рисунке поля. Ограничение, о котором легко забыть: контент русский, и у половины выразительных шрифтов нет кириллицы. У обоих выбранных она родная.

**Файлы:**
- Изменить: `client/package.json`
- Изменить: `client/src/index.css`
- Изменить: `client/tailwind.config.js`

- [ ] **Шаг 1: Поставить шрифты пакетами, а не ссылкой на Google Fonts**

Шрифты живут в сборке, а не подтягиваются со стороннего домена: заказчик в России, и внешний шрифтовой CDN — лишняя точка отказа ровно того же рода, из-за которой из проекта убрали PostHog. Отвалившийся шрифт заменяется системным молча, и заметить это на своей машине невозможно.

Выполнить из корня:

```bash
yarn workspace @trgames/client add @fontsource/unbounded @fontsource/golos-text
```

Оба пакета содержат кириллический поднабор — это здесь не мелочь, а условие: контент русский, и у половины выразительных шрифтов кириллицы нет.

В `client/src/index.css` в самое начало, до директив Tailwind:

```css
@import '@fontsource/unbounded/400.css';
@import '@fontsource/unbounded/600.css';
@import '@fontsource/unbounded/800.css';
@import '@fontsource/golos-text/400.css';
@import '@fontsource/golos-text/500.css';
@import '@fontsource/golos-text/600.css';
```

Если stylelint ругается на порядок `@import` — переставь их выше всего остального, а не глуши правило.

- [ ] **Шаг 2: Объявить семейства в Tailwind**

В `client/tailwind.config.js` в `theme.extend` добавить рядом с `colors`:

```js
      fontFamily: {
        // Название мира, числа, кубик
        unbounded: ['Unbounded', 'system-ui', 'sans-serif'],
        // Весь остальной текст
        golos: ['"Golos Text"', 'system-ui', 'sans-serif'],
      },
```

- [ ] **Шаг 3: Проверить сборку**

Выполнить: `yarn workspace @trgames/client build`
Ожидается: сборка проходит.

- [ ] **Шаг 4: Коммит**

```bash
git add client/package.json client/src/index.css client/tailwind.config.js yarn.lock
git commit -m "feat(lucid): подключить шрифты Unbounded и Golos Text"
```

---

## Задача 8: Личность игрока, адрес и маршруты

Место в партии закрепляется за анонимным идентификатором, а не за соединением и не за ником: вернулся тот же браузер — вернулся тот же игрок. Схему соседней игры (опознание по нику) заимствовать нельзя — место занял бы любой, кто ник знает.

**Файлы:**
- Создать: `client/src/hooks/usePlayerId.ts`
- Изменить: `client/src/lib/constants.ts`
- Создать: `client/src/routes/games/lucid/index.tsx`
- Создать: `client/src/routes/games/lucid/RootLayout/index.tsx`
- Создать: `client/src/routes/games/lucid/LobbyPage/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/index.tsx`
- Создать: `client/src/routes/GamesPage/components/gameCards/LucidCard/index.tsx`
- Изменить: `client/src/App.tsx`
- Изменить: `client/src/routes/GamesPage/index.tsx`

- [ ] **Шаг 1: Идентификатор игрока**

`client/src/hooks/usePlayerId.ts`:

```ts
import { useLocalStorage } from 'usehooks-ts';
import { uid } from 'uid';

// Анонимный идентификатор живёт в браузере и переживает перезагрузку страницы.
// При появлении учётных записей он привяжется к учётке, а не выбросится
export const usePlayerId = (): string => {
  const [playerId, setPlayerId] = useLocalStorage('trgames:player-id', '');

  if (!playerId) {
    const created = uid();
    setPlayerId(created);

    return created;
  }

  return playerId;
};
```

- [ ] **Шаг 2: Адрес неймспейса**

В `client/src/lib/constants.ts` добавить `lucidPath` в обе конфигурации и функцию адреса:

```ts
export const API_CONFIG = {
  development: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001',
    cryptozPath: '/cryptoz',
    lucidPath: '/lucid',
  },
  production: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://troexol.ru',
    cryptozPath: '/cryptoz',
    lucidPath: '/lucid',
  },
} as const;
```

И рядом с существующим `getApiUrl`:

```ts
export const getLucidUrl = (path = '') => {
  const config = import.meta.env.DEV ? API_CONFIG.development : API_CONFIG.production;

  return `${config.baseUrl}${config.lucidPath}${path}`;
};
```

Существующий `getApiUrl` не трогать: он обслуживает соседнюю игру.

- [ ] **Шаг 3: Маршруты**

`client/src/routes/games/lucid/index.tsx`:

```tsx
import { RootLayout } from './RootLayout';

export const lucidRoutes = {
  path: '/game/lucid',
  element: <RootLayout />,
  children: [
    {
      path: '/game/lucid',
      index: true,
      lazy: () => import('@/routes/games/lucid/LobbyPage'),
    },
    {
      path: '/game/lucid/party/:partyId',
      lazy: () => import('@/routes/games/lucid/PartyPage'),
    },
  ],
};
```

`client/src/routes/games/lucid/RootLayout/index.tsx`:

```tsx
import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const RootLayout = observer(function RootLayout() {
  return (
    <div className="min-h-dvh font-golos">
      <Outlet/>
    </div>
  );
});
```

Обёртку темы соседней игры (`useGameTheme`) lucid не использует: оформление здесь задаётся переменными из сгенерированной палитры, а не классом с заранее написанными стилями.

- [ ] **Шаг 4: Заглушки страниц**

`client/src/routes/games/lucid/LobbyPage/index.tsx` — на этом шаге кнопка, которая пока ничего не делает; создание партии появится в задаче 9:

```tsx
import { useDocumentTitle } from 'usehooks-ts';
import { observer } from 'mobx-react-lite';

export const Component = observer(function LucidLobbyPage() {
  useDocumentTitle('lucid — новая партия');

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4">
      <h1 className="font-unbounded text-4xl">lucid</h1>
    </main>
  );
});
```

`client/src/routes/games/lucid/PartyPage/index.tsx`:

```tsx
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const Component = observer(function LucidPartyPage() {
  const { partyId } = useParams();

  return (
    <main className="min-h-dvh px-4 py-6">
      <p className="font-golos">{partyId}</p>
    </main>
  );
});
```

- [ ] **Шаг 5: Подключить маршруты и карточку игры**

В `client/src/App.tsx` добавить импорт `lucidRoutes` и поставить его в `children` рядом с `cryptozRoutes`.

`client/src/routes/GamesPage/components/gameCards/LucidCard/index.tsx` — своя карточка, а не `BaseGameCard`: у того обязательна картинка, а у lucid картинок нет по замыслу. Мотив карточки — та же схема маршрута, что и на поле:

```tsx
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const LucidCard = observer(function LucidCard() {
  return (
    <Link
      className="relative overflow-hidden rounded-3xl border-4 border-border bg-black/40
        p-20 text-center font-unbounded text-4xl font-bold transition-shadow
        hover:shadow-lg hover:shadow-accent"
      to="/game/lucid"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 200 120"
      >
        <path
          d="M10 60 H60 l20 -20 h40 l20 20 h50 M60 60 l20 20 h40 l20 -20"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span className="relative">lucid</span>
    </Link>
  );
});
```

В `client/src/routes/GamesPage/index.tsx` добавить `<LucidCard/>` рядом с `<CryptozCard/>`.

- [ ] **Шаг 6: Проверить**

Выполнить: `yarn workspace @trgames/client lint`
Ожидается: проходит.

Затем `yarn workspace @trgames/client dev` и открыть `http://localhost:3000/game/lucid` — страница отвечает, в консоли пусто.

- [ ] **Шаг 7: Коммит**

```bash
git add client/src
git commit -m "feat(lucid): добавить маршруты игры и анонимный идентификатор игрока"
```

---

## Задача 9: Соединение и состояние партии

Один неймспейс на игру, комната на партию, одно соединение у игрока. Клиент рисует то, что прислали, и ничего не достраивает сам.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/stores/PartyStore.ts`
- Создать: `client/src/routes/games/lucid/PartyPage/stores/index.ts`
- Создать: `client/src/routes/games/lucid/PartyPage/services/SocketService.ts`
- Создать: `client/src/routes/games/lucid/PartyPage/services/index.ts`
- Создать: `client/src/routes/games/lucid/PartyPage/services/createParty.ts`
- Изменить: `client/src/routes/games/lucid/LobbyPage/index.tsx`
- Изменить: `client/src/routes/games/lucid/PartyPage/index.tsx`

- [ ] **Шаг 1: Стор партии**

`client/src/routes/games/lucid/PartyPage/stores/PartyStore.ts`:

```ts
import type { LucidShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';

// Лента отвечает на вопрос «я отвлёкся, что я пропустил», а не хранит историю:
// старое уходит безвозвратно
const RIBBON_LIMIT = 4;

export type TConnection = 'connecting' | 'offline' | 'online';

export class PartyStore {
  public view?: LucidShared.TPartyView;

  public ribbon: string[] = [];

  public connection: TConnection = 'connecting';

  public error?: string;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get state(): LucidShared.TStateForPlayer | undefined {
    return this.view?.state;
  }

  public get isMyTurn(): boolean {
    return Boolean(this.state && this.state.ctx.currentPlayer === this.state.you);
  }

  public get isOwner(): boolean {
    return Boolean(this.view && this.view.ownerId === this.view.you);
  }

  public applyView(view: LucidShared.TPartyView): void {
    this.view = view;
  }

  public appendRibbon(lines: string[]): void {
    this.ribbon = [...this.ribbon, ...lines].slice(-RIBBON_LIMIT);
  }

  public setConnection(connection: TConnection): void {
    this.connection = connection;
  }

  public setError(error?: string): void {
    this.error = error;
  }

  public reset(): void {
    this.view = undefined;
    this.ribbon = [];
    this.connection = 'connecting';
    this.error = undefined;
  }
}

export const partyStore = new PartyStore();
```

`client/src/routes/games/lucid/PartyPage/stores/index.ts`:

```ts
export { partyStore, PartyStore } from './PartyStore';
```

- [ ] **Шаг 2: Соединение**

`client/src/routes/games/lucid/PartyPage/services/SocketService.ts`:

```ts
import type { Socket } from 'socket.io-client';

import { toast } from 'sonner';
import { LucidShared } from '@trgames/shared';
import { io } from 'socket.io-client';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { getLucidUrl } from '@/lib/constants';

interface TConnectParams {
  partyId: string;
  playerId: string;
  nickname: string;
}

type TSocket = Socket<
  LucidShared.TLucidServerToClientEvents,
  LucidShared.TLucidClientToServerEvents
>;

export class SocketService {
  private socket: TSocket | undefined;

  public connect = ({ partyId, playerId, nickname }: TConnectParams): void => {
    this.disconnect();

    this.socket = io(getLucidUrl(), {
      query: { partyId, playerId, nickname },
      multiplex: false,
    }) as TSocket;

    this.socket.on('connect', () => partyStore.setConnection('online'));
    this.socket.on('disconnect', () => partyStore.setConnection('offline'));

    this.socket.on('connect_error', error => {
      partyStore.setConnection('offline');
      partyStore.setError(error.message || 'Не удалось подключиться к партии');
    });

    this.socket.on(LucidShared.ELucidEvent.updateParty, view => partyStore.applyView(view));
    this.socket.on(LucidShared.ELucidEvent.appendRibbon, lines => partyStore.appendRibbon(lines));

    // Отказ по существу возможен только один: клиент отстал на версию и успел
    // нажать. Правильный ответ там — свежее состояние, оно придёт следом
    this.socket.on(LucidShared.ELucidEvent.showError, ({ message }) => toast.error(message));
  };

  public disconnect = (): void => {
    this.socket?.disconnect();
    this.socket = undefined;
  };

  public proposeTheme = (theme: string): void => {
    this.socket?.emit(LucidShared.ELucidEvent.proposeTheme, theme);
  };

  public declineTheme = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.declineTheme);
  };

  public startParty = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.startParty);
  };

  public makeMove = (move: LucidShared.TMove): void => {
    this.socket?.emit(LucidShared.ELucidEvent.makeMove, move);
  };

  public playAgain = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.playAgain);
  };
}

export const socketService = new SocketService();
```

`client/src/routes/games/lucid/PartyPage/services/index.ts`:

```ts
export { createParty } from './createParty';
export { socketService, SocketService } from './SocketService';
```

- [ ] **Шаг 3: Создание партии**

`client/src/routes/games/lucid/PartyPage/services/createParty.ts` — отдельное короткоживущее соединение с лобби: партии ещё нет, значит и комнаты нет.

```ts
import { LucidShared } from '@trgames/shared';
import { io } from 'socket.io-client';

import { getLucidUrl } from '@/lib/constants';

export const createParty = (playerId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const socket = io(getLucidUrl('/lobby'), {
      query: { playerId },
      multiplex: false,
    });

    const finish = (): void => {
      socket.disconnect();
    };

    socket.on('connect_error', error => {
      finish();
      reject(new Error(error.message || 'Сервер недоступен'));
    });

    socket.on('connect', () => {
      socket.emit(LucidShared.ELucidEvent.createParty, result => {
        finish();

        if (result.status === 'ok') {
          resolve(result.partyId);
        } else {
          reject(new Error(result.message));
        }
      });
    });
  });
};
```

- [ ] **Шаг 4: Создание партии на странице лобби**

`client/src/routes/games/lucid/LobbyPage/index.tsx` — кнопка создаёт партию и уводит на её адрес. Списка открытых партий нет: игра рассчитана на компанию, которая уже договорилась играть.

Страница содержит: заголовок `lucid` шрифтом Unbounded, одну строку о том, что партия генерируется нейросетью и играется по ссылке, кнопку «Создать партию» (`@/components/ui/Button`), состояние ожидания на время запроса и `toast.error` при отказе. После успеха — `navigate(`/game/lucid/party/${partyId}`)`.

- [ ] **Шаг 5: Подключение на странице партии**

`client/src/routes/games/lucid/PartyPage/index.tsx` — на этом шаге: спросить ник, если его нет (`useNickname`), затем подключиться и показать фазу текстом. Экраны появятся в следующих задачах.

Требования к этому шагу:
- `usePlayerId()` и `useNickname()` дают идентификатор и подпись.
- Пока ник пуст — форма с одним полем и кнопкой; подключение не начинается.
- `useEffect` подключает при появлении всех трёх значений и **отключает при размонтировании**, вызывая `partyStore.reset()`.
- Пока `partyStore.view` не пришёл — строка «Подключаемся».
- При `partyStore.error` — сообщение и кнопка «Попробовать снова».
- Дальше — `<p>{partyStore.view.phase}</p>`, временно.

- [ ] **Шаг 6: Проверить живьём**

Запустить сервер и клиент: `yarn start:dev`.

Открыть `http://localhost:3000/game/lucid`, нажать создание партии — адрес меняется на `/game/lucid/party/<id>`, после ввода ника на экране появляется `LOBBY`. Открыть тот же адрес во втором окне (режим инкогнито — иначе идентификатор игрока совпадёт) — оба окна остаются в `LOBBY`, в консоли ошибок нет.

- [ ] **Шаг 7: Коммит**

```bash
git add client/src
git commit -m "feat(lucid): подключить клиент к партии и лобби"
```

---

## Задача 10: Экран лобби

Отдельной кнопки готовности нет: игрок называется и либо вводит тему, либо нажимает «не хочу предлагать тему» — это и есть сигнал готовности.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/Lobby/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/components/Lobby/components/MemberRow/index.tsx`
- Изменить: `client/src/routes/games/lucid/PartyPage/index.tsx`

- [ ] **Шаг 1: Строка участника**

`MemberRow` принимает `member: LucidShared.TLobbyMember` и `isOwner: boolean`. Показывает:
- ник;
- пометку «создатель» у создателя партии;
- пометку «связь потеряна», если `isConnected` ложно;
- предложенную тему в кавычках, если `themeProposal` есть;
- «не предлагает тему», если `hasAnswered` истинно, а `themeProposal` пуст;
- «думает», если `hasAnswered` ложно.

Предложения видны всем до жеребьёвки — это социальный момент, на чужую выдумку хочется ответить своей.

- [ ] **Шаг 2: Экран лобби**

`Lobby` берёт данные из `partyStore` и вызывает `socketService`. Состав экрана сверху вниз:

1. Заголовок `lucid` шрифтом Unbounded и под ним одна строка: партия придумывается нейросетью по теме, которую выберет кубик.
2. Ссылка-приглашение: поле только для чтения с текущим адресом страницы и кнопка «Скопировать ссылку» (`navigator.clipboard.writeText`, подтверждение через `toast.success`). Партия раздаётся ссылкой, списка открытых партий нет.
3. Список участников из `view.members` строками `MemberRow`.
4. Своё действие по теме, если `hasAnswered` у себя ложно: поле ввода (максимум 60 знаков) и две кнопки — «Предложить тему» (отправляет `proposeTheme`, кнопка выключена при пустом поле) и «Не хочу предлагать тему» (отправляет `declineTheme`).
5. Если уже ответил — строка «Ждём остальных» либо, у создателя, кнопка запуска.

- [ ] **Шаг 3: Кнопка запуска**

Видна только создателю (`partyStore.isOwner`). Выключена, пока участников меньше двух.

На кнопке написано, что именно произойдёт, а не просто «начать» — после нажатия обратной дороги нет:

```
Начать партию — состав закроется, генерация займёт около полутора минут
```

Право у одного человека: тогда партия не стартует, пока кто-то дописывает тему, и не зависает, если участник исчез совсем.

- [ ] **Шаг 4: Подключить к странице партии**

В `PartyPage` заменить временный вывод фазы на выбор экрана: `LOBBY` → `<Lobby/>`, остальные фазы пока оставить прежним текстом.

- [ ] **Шаг 5: Проверить живьём**

`yarn start:dev`, два окна (второе — инкогнито). В обоих виден состав, предложения тем появляются у обоих, кнопка запуска есть только у создателя.

- [ ] **Шаг 6: Коммит**

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): экран лобби с предложением темы и запуском"
```

---

## Задача 11: Ожидание генерации

Генерация занимает около полутора минут, и это единственный момент партии, когда игроки ничего не делают. Поэтому ожидание устроено как раскрытие, а не как полоса загрузки.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/Generating/index.tsx`
- Изменить: `client/src/routes/games/lucid/PartyPage/index.tsx`

- [ ] **Шаг 1: Экран раскрытия**

Сервер сообщает о завершении каждой стадии отдельным `update-party`, поэтому стадия определяется по тому, что уже пришло, а не по таймеру:

| Что пришло | Что на экране |
|---|---|
| `theme` нет | «Придумываем мир» и спокойная точка ожидания |
| `theme` есть, `state` нет | Название мира шрифтом Unbounded, оформление уже перекрашено, строка «Чертим тропу» |
| `state` есть | Экран партии (фаза уже `PLAYING`) |

Название ресурса из темы показывается второй строкой: «здесь считают: заряды».

Раскрытие не ускоряет генерацию, а только меняет, чем занято ожидание.

- [ ] **Шаг 2: Оформление применяется сразу**

Как только `view.theme` пришла, тема перекрашивает всё вокруг. Стиль считается один раз на изменение темы:

```tsx
const roles = useMemo(
  () => deriveRoles(theme?.palette ?? [], theme?.mood),
  [theme?.palette, theme?.mood],
);
const style = useMemo(() => themeStyle(roles, theme?.name ?? ''), [roles, theme?.name]);
```

Поле `mood` необязательно; если его нет, `deriveRoles` решит по средней светлоте палитры. Если задача 16 плана транспорта ещё не выполнена и поля в типе нет — передавай `undefined` и открой её раньше этой.

Стиль вешается на корневой контейнер `PartyPage`, а не на экран генерации: смена фазы не должна сбрасывать оформление.

- [ ] **Шаг 3: Честность про запасную партию**

Если `view.usedFallback` истинно, под названием мира показывается одна строка, признающая промах игры, а не винящая игроков или «сервис»:

```
Мир придумать не вышло — играем на заготовленном.
```

Выбор «подождать ещё или играть на запасном» не предлагается: запасная партия существует ровно для того, чтобы вечер не умер.

Эта же строка приходит в ленту событий с сервера, поэтому здесь она нужна только на экране ожидания — подключившийся позже прочтёт её в ленте.

- [ ] **Шаг 4: Движение**

Одно оркестрованное движение: появление названия мира. Никаких выездов секций снизу и анимаций при наведении. Уважать `prefers-reduced-motion` — при нём переход мгновенный.

- [ ] **Шаг 5: Проверить и закоммитить**

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): показать раскрытие мира во время генерации"
```

---

## Задача 12: Поле

Поле — единственный смелый элемент, всё остальное вокруг него молчит. Рисуется языком схемы маршрутов: наша структура данных буквально есть маршрутный граф с ветвлениями и точками схождения.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/Board/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/components/Board/linkPath.ts`
- Создать: `client/src/routes/games/lucid/PartyPage/components/Board/linkPath.test.ts`

- [ ] **Шаг 1: Написать падающий тест на геометрию линии**

`client/src/routes/games/lucid/PartyPage/components/Board/linkPath.test.ts`:

```ts
import {
  describe,
  expect,
  it,
} from 'vitest';

import { linkPath } from './linkPath';

const cell = (x: number, y: number, col = 0) => ({ x, y, col });

describe('линия трека', () => {
  it('идёт прямо внутри ряда', () => {
    expect(linkPath(cell(50, 60), cell(150, 60), 12)).toBe('M50 60H150');
  });

  it('поворачивает на 45 градусов при сходе на прядь', () => {
    const path = linkPath(cell(50, 60), cell(150, 94), 12);

    // Сначала горизонтально, затем диагональ ровно на 45 градусов
    expect(path).toBe('M50 60H116L150 94');
  });

  it('разворачивается в конце ряда без вертикального излома', () => {
    const path = linkPath(cell(750, 60, 7), cell(750, 180, 7), 8);

    expect(path.startsWith('M750 60')).toBe(true);
    expect(path).toContain('V');
  });

  it('не падает на совпадающих точках', () => {
    expect(() => linkPath(cell(50, 60), cell(50, 60), 12)).not.toThrow();
  });
});
```

- [ ] **Шаг 2: Написать построение линии**

`client/src/routes/games/lucid/PartyPage/components/Board/linkPath.ts`. Толщина линии одинакова везде — путь равноправен на всём протяжении; повороты кратны 45°.

```ts
interface TPoint {
  x: number;
  y: number;
  col: number;
}

// Длина скоса на развороте в конце ряда
const TURN = 28;

const round = (value: number): number => Math.round(value * 100) / 100;

export const linkPath = (from: TPoint, to: TPoint, perRow: number): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dy === 0) {
    return `M${round(from.x)} ${round(from.y)}H${round(to.x)}`;
  }

  // Разворот в конце ряда: выходим наружу скосом, идём вниз, возвращаемся скосом
  if (dx === 0) {
    const step = Math.min(TURN, Math.abs(dy) / 2);
    const side = from.col === 0 ? -1 : 1;
    const down = Math.sign(dy);

    return `M${round(from.x)} ${round(from.y)}`
      + `L${round(from.x + side * step)} ${round(from.y + down * step)}`
      + `V${round(to.y - down * step)}`
      + `L${round(to.x)} ${round(to.y)}`;
  }

  const side = Math.sign(dx);
  const diagonal = Math.min(Math.abs(dy), Math.abs(dx));
  const straight = Math.abs(dx) - diagonal;

  return `M${round(from.x)} ${round(from.y)}`
    + `H${round(from.x + side * straight)}`
    + `L${round(to.x)} ${round(to.y)}`;
};
```

Параметр `perRow` в подписи оставлен намеренно: он понадобится, когда развороты начнут различать левый и правый край при нечётном числе рядов. Если линтер ругается на неиспользуемый аргумент — **убери параметр**, а не глуши правило.

- [ ] **Шаг 3: Запустить тест**

Выполнить: `yarn workspace @trgames/client test --run src/routes/games/lucid/PartyPage/components/Board/linkPath.test.ts`
Ожидается: зелёные. Ожидаемые строки в тесте выведены из формул выше; если расходятся — считай руками и исправляй то, что неверно.

- [ ] **Шаг 4: Нарисовать поле**

`Board` получает `state: LucidShared.TStateForPlayer` и рисует SVG. Что кодирует рисунок, а не украшает:

- Линия одной толщины (`--lucid-line`), `stroke-linecap: round`.
- Клетка — кружок радиуса 14. Пройденная (`state.G.visited` содержит её номер) залита цветом линии, непройденная — только обводка.
- Старт и финиш — не кружки, а квадрат со скруглением: у пути есть начало и конец, и это видно без подписей.
- Развилка читается геометрией: две пряди расходятся и сходятся. Подписи нет.
- Клетки, доступные для выбора ветки (`state.G.branchChoices`), обведены акцентом и кликабельны.
- Фишки едут по линии, а не стоят рядом с ней: кружок радиуса 10 в центре клетки, при нескольких игроках на клетке — по кругу со смещением `12px` под углом `index * 360 / count`.
- Фишка ходящего игрока обведена акцентом.
- Над фишкой — ник мелко, шрифтом Golos, с обводкой цветом основы для читаемости поверх линии.

Ширина берётся из контейнера (`useDeviceWidth` уже есть в репозитории либо `ResizeObserver`), число клеток в ряду — `cellsPerRow(width)`. `viewBox` равен `0 0 layout.width layout.height`, `preserveAspectRatio="xMidYMid meet"`.

- [ ] **Шаг 5: Прочертить трек один раз**

При первом появлении поля линия прочерчивается от старта к финишу: общий `<path>` со `stroke-dasharray`, равной его длине (`getTotalLength()`), и анимацией `stroke-dashoffset` от неё до нуля за 1200 мс. Дальше движется только фишка, и только в ответ на ход игрока.

При `prefers-reduced-motion: reduce` прочерчивание пропускается.

- [ ] **Шаг 6: Песочница в Storybook**

Создать: `client/src/routes/games/lucid/PartyPage/components/Board/Board.stories.tsx`.

Это **единственная история для lucid** и написана она ради одного: показать заказчику облик поля до того, как поверх него лягут полосы, лента и карточка события. Сервер, партия и остальной клиент для этого не нужны.

Истории на выдуманных данных — по одной на каждый случай, который стоит увидеть:

1. **Короткий трек, две развилки, четыре игрока.** Тёмная палитра вроде `['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd']`, мир «Заброшенная станция».
2. **Длинный трек на пятьдесят клеток, шесть игроков.** Та же палитра — видно, как змейка ведёт себя на полной длине.
3. **Светлая палитра**, например `['#f6f4ef', '#e8dcc8', '#c0a080', '#1b2a41']`, мир «Пираты Карибского моря» — проверка, что вывод ролей работает в обе стороны.
4. **Недружественная палитра** из пяти почти одинаковых серо-бурых: убедиться, что поле читается и на ней.
5. **Узкая раскладка**, ширина 360 — телефонный случай.

Трек для историй строить тем же способом, что и сервер, а не рисовать руками: скопируй в файл истории небольшую функцию, собирающую `TTrack` из прямых участков и развилок, — так форма будет настоящей, а не удобной.

Состояние игроков задать руками: кто-то в начале, кто-то в середине, двое на одной клетке (проверка расстановки фишек по кругу), один — на клетке развилки с подсвеченными вариантами.

- [ ] **Шаг 7: Показать заказчику**

Остановиться. Запустить `yarn workspace @trgames/client storybook`, сделать снимки всех пяти историй и показать. Дальше по плану не идти, пока облик не принят: остальные экраны строятся поверх поля, и переделка после них стоит втрое.

Заказчик утверждал облик брифом («красиво, не перегружено, но чтобы было интересно смотреть»), а не по пунктам — `DESIGN.md` написан по этому брифу мной. Здесь он впервые видит результат.

- [ ] **Шаг 8: Проверить и закоммитить**

Поле должно читаться на ширине 360 CSS-пикселей без горизонтальной прокрутки.

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): нарисовать трек схемой маршрутов"
```

---

## Задача 13: Полосы и лента

Интерфейс лежит поверх поля узкими полосами сверху и снизу. Поле занимает экран целиком.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/Hud/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/components/Hud/components/Die/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/components/Ribbon/index.tsx`

- [ ] **Шаг 1: Верхняя полоса**

Слева — название мира шрифтом Unbounded, одной строкой с обрезкой. Справа — свой запас ресурса: число шрифтом Unbounded и название ресурса из темы мелко. Под ними — состав партии одной строкой: ники с отметкой у ходящего.

Рядом с ником игрока, который не на связи, — пометка «связь потеряна». Пока за отвалившегося ходит автопилот, это видно всем: иначе остальные обсуждают решения, которых человек не принимал.

- [ ] **Шаг 2: Кубик**

`Die` показывает `state.G.lastRoll`. Грань рисуется точками (SVG), число дублируется цифрой шрифтом Unbounded — на маленьком экране точки читаются хуже.

Если у броска есть `threshold`, под гранью строка «порог N» и отметка, взят он или нет. Порог кубика — часть решения, а не сноска.

Когда броска ещё не было, кубик показывается погашенным.

- [ ] **Шаг 3: Нижняя полоса**

Содержимое зависит от фазы `state.ctx.phase` и от того, твой ли ход:

| Фаза | Твой ход | Не твой ход |
|---|---|---|
| `ROLL` | Кнопка «Бросить кубик» | «Ходит {ник}» |
| `BRANCH` | «Выбери, куда свернуть» и две кнопки по числу веток | «Ходит {ник}» |
| `CHOICE` | Карточка события открыта поверх (задача 14) | «Ходит {ник}» |
| `ENDED` | Экран конца партии (задача 15) | то же |

**Невозможное нельзя нажать:** не твой ход — кнопки выключены. Тогда отказ сервера перестаёт быть событием для человека.

Оптимистичных ходов нет: после нажатия кнопка блокируется до прихода нового `stateId`, а не до применения хода у себя.

Ход отправляется с текущим `stateId`:

```ts
socketService.makeMove({
  type: EMoveType.ROLL,
  playerId: state.you,
  stateId: state.stateId,
});
```

Справа в полосе — ползунок громкости (задача 16).

- [ ] **Шаг 4: Лента**

`Ribbon` показывает `partyStore.ribbon` — последние три-четыре строки, всегда на виду, над нижней полосой. Старое уходит безвозвратно. Новая строка появляется мягким проявлением, без выезда.

Лента показывает, что произошло, а не что игрок выбрал из предложенного: по ней иначе читается чужая стратегия, а в игре, где половина эффектов бьёт по лидеру, это меняет поведение. Никаких добавлений от клиента: рисуем то, что прислали.

- [ ] **Шаг 5: Проверить и закоммитить**

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): полосы интерфейса, кубик и лента событий"
```

---

## Задача 14: Карточка события и выбор ветки

Событие открывается полноэкранной карточкой: текст и варианты читаются крупно, ничто не мешает. Закрыть её нельзя, но можно свернуть — чтобы осмотреть поле и вернуться к выбору.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/EventCard/index.tsx`
- Создать: `client/src/routes/games/lucid/PartyPage/components/EventCard/OptionButton.tsx`

- [ ] **Шаг 1: Карточка**

Открыта, когда `state.ctx.phase === EPhase.CHOICE`. Событие берётся по клетке ходящего игрока: `state.G.events[state.G.players[state.ctx.currentPlayer].position]`.

Содержимое: заголовок события шрифтом Unbounded, текст шрифтом Golos (до 400 знаков, строка до 80 знаков длиной), список вариантов.

Если ход не твой — карточка показывает то же самое без кнопок, строкой «Выбирает {ник}». Все читают одно и то же событие: это общий момент партии.

- [ ] **Шаг 2: Сворачивание**

Закрыть нельзя, свернуть можно. **Свёрнутое состояние обязано читаться как «ход ждёт тебя», а не как «окно закрыто»**: иначе игрок свернёт карточку и будет гадать, почему ничего не происходит.

Свёрнутый вид — полоса над нижней полосой интерфейса, цветом акцента, с текстом «Ход ждёт тебя: {заголовок события}» и кнопкой «Развернуть». Полоса не исчезает и не прячется за другими элементами.

Своё, а не `CollapsibleDialog` из соседней игры: тот завязан на её очередь модалок, а Cryptoz мы сейчас не трогаем.

- [ ] **Шаг 3: Вариант выбора**

`OptionButton` принимает `option: LucidShared.TOption`, `resource: number`, `disabled: boolean`.

Строка варианта собирается так:
- основной текст варианта;
- если есть `threshold` — «нужно {threshold} и больше на кубике»; порог показывается **всегда**, а не только при наведении: решение принимается по нему;
- если есть `cost` — «стоит {cost} {название ресурса}».

Если `cost` больше запаса — вариант виден, но недоступен, и рядом сказано почему: «не хватает {cost - resource}». Тогда отказ сервера снова перестаёт быть событием для человека.

Нажатие отправляет:

```ts
socketService.makeMove({
  type: EMoveType.CHOOSE_OPTION,
  playerId: state.you,
  stateId: state.stateId,
  optionIndex: index,
});
```

- [ ] **Шаг 4: Выбор ветки**

Фаза `BRANCH`. Развилка читается геометрией, поэтому основной способ выбрать — нажать на одну из подсвеченных клеток прямо на поле. Дублирующие кнопки в нижней полосе обязательны: на телефоне попасть по клетке пальцем труднее, а телефон не получает урезанную игру.

Кнопки подписываются направлением относительно линии: «верхняя тропа» и «нижняя тропа» — по знаку `strand` из раскладки. Ход:

```ts
socketService.makeMove({
  type: EMoveType.CHOOSE_BRANCH,
  playerId: state.you,
  stateId: state.stateId,
  cellId,
});
```

- [ ] **Шаг 5: Проверить и закоммитить**

Проверить руками: вариант с недостаточным ресурсом не нажимается и объясняет причину; свёрнутая карточка видна и разворачивается; чужой ход показывает событие без кнопок.

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): карточка события со сворачиванием и выбор ветки"
```

---

## Задача 15: Конец партии

Вечер — это обычно не одна партия, а две-три подряд, и момент сразу после победы решает, случится ли вторая.

**Файлы:**
- Создать: `client/src/routes/games/lucid/PartyPage/components/Ending/index.tsx`
- Изменить: `client/src/routes/games/lucid/PartyPage/index.tsx`

- [ ] **Шаг 1: Экран победы**

Показывается при `view.phase === EPartyPhase.ENDED`. Поле остаётся видимым под ним — партия закончилась на нём, и это стоит показать.

Содержимое: ник победителя крупно шрифтом Unbounded, под ним название мира. Итогов партии нет: полная история не хранится, считать их не из чего.

Если победителем оказался игрок, который не на связи, это сказано прямо: автопилот может победить, и это принято сознательно.

- [ ] **Шаг 2: Сыграть ещё**

Кнопка «Сыграть ещё тем же составом» отправляет `playAgain`. Создаётся новая партия, места в ней уже заняты прежним составом, тема выбирается заново, мир другой. Заново рассылать ссылку там, где все уже собраны, — лишнее.

Номер новой партии приходит полем `view.nextPartyId`. Как только оно появилось — переход на `/game/lucid/party/${nextPartyId}` **у всех**, а не только у нажавшего: остальные не нажимали ничего, и оставить их на экране победы значило бы разорвать компанию.

Переход делать через `useEffect` по появлению поля, а не в обработчике нажатия: инициатор узнаёт о новой партии тем же способом, что и все, и отдельной ветки для него не нужно.

После нажатия кнопка блокируется до прихода нового вида.

Если сервер отвечает ошибкой, она придёт через `show-error` и покажется тостом — отдельной обработки не нужно.

- [ ] **Шаг 3: Проверить и закоммитить**

```bash
git add client/src/routes/games/lucid
git commit -m "feat(lucid): экран конца партии и повторная игра"
```

---

## Задача 16: Звук

Играют в голосовом чате, где фоновая музыка конкурирует с речью. Поэтому музыка звучит сразу, но негромко, а регулятор живёт на игровом экране, а не в настройках: музыку чаще убавляют, чем выключают.

**Файлы:**
- Создать: `client/src/assets/games/lucid/sounds/` — семь файлов звуков
- Создать: `client/src/assets/games/lucid/music/` — две дорожки
- Создать: `client/src/services/LucidSoundService.ts`
- Изменить: `client/src/services/index.ts`
- Изменить: `client/src/stores/SettingsStore.ts`
- Изменить: `client/src/routes/games/lucid/PartyPage/components/Hud/index.tsx`
- Изменить: `docs/lucid/CONTEXT.md` — источник и лицензия звуков

- [ ] **Шаг 1: Громкость в общих настройках**

Громкость одна на все игры, поэтому живёт в разделе `general`, а не в игровом.

В `client/src/stores/SettingsStore.ts` заменить `TGeneralSettings` на:

```ts
interface TGeneralSettings {
  // Музыка играет сразу, но негромко: её чаще убавляют, чем выключают
  volume: number;
}
```

Значение по умолчанию — `{ volume: 0.35 }`. Добавить метод `setVolume(value: number)` с сохранением, как у существующего `setCryptozShowFullHandCards`, и разбор числа в `loadFromStorage` рядом с разбором `cryptoz`.

- [ ] **Шаг 2: Положить файлы звуков**

Звуки — готовые записи, а не синтез: синтезированные тона решают задачу «чтобы игра была живее» наполовину, а заказчик просил именно живости.

Источник — паки **Kenney** под лицензией CC0: она разрешает коммерческое использование, изменение и распространение, и не требует указания автора. Все шесть действий закрываются четырьмя паками:

| Событие | Откуда брать |
|---|---|
| бросок кубика | Casino Audio — там есть броски кубиков |
| шаг фишки | Interface Sounds или UI Audio, короткий мягкий щелчок |
| открытие события | Impact Sounds, глухой удар с затуханием |
| ресурс получен или потерян | Interface Sounds, пара «вверх» и «вниз» |
| выбор ветки | UI Audio, переключатель |
| победа | Music Jingles, короткое трезвучие |

Файлы класть в `client/src/assets/games/lucid/sounds/` под говорящими именами: `dice.ogg`, `step.ogg`, `event.ogg`, `resource-up.ogg`, `resource-down.ogg`, `branch.ogg`, `win.ogg`. Формат `ogg` предпочтительнее `wav`: те же звуки весят в разы меньше, а поддержка в браузерах полная.

Отобрать по одному файлу на действие, а не складывать пак целиком: в паках по сотне звуков, а нам нужно семь.

Указание авторства CC0 не требует, но строку «Звуки — Kenney.nl, CC0» добавить в `docs/lucid/CONTEXT.md` в раздел «Звук»: через год будет неочевидно, откуда они взялись и можно ли их трогать.

Озвучиваются ровно эти шесть действий, остальное молчит — иначе выйдет не живо, а шумно.

**Если подходящего звука в паках не нашлось** — не подменяй его синтезом молча и не тащи файл с непроверенной лицензией. Запиши, какого именно звука не хватило, в `docs/lucid/OPEN-QUESTIONS.md`: заказчик сказал, что в этом случае сделает звук сам.

- [ ] **Шаг 3: Проигрывание**

`LucidSoundService` держит по одному `AudioBuffer` на звук и проигрывает их через общий `GainNode`, умноженный на громкость из настроек.

`AudioContext` создаётся **лениво, при первом действии человека**: браузер не позволяет запустить звук раньше. Вход в партию всё равно начинается с нажатий.

Звуки грузятся один раз при входе в партию и складываются в словарь. Если загрузка не удалась — молчание на этом звуке, а не исключение: партия важнее звука.

- [ ] **Шаг 4: Музыка**

Две дорожки по настроению темы: тёмная тревожная получает одну, светлая авантюрная — другую. То же поле настроения выбирает светлую или тёмную палитру, поэтому окупается дважды.

**Дорожки уже лежат** в `client/src/assets/games/lucid/music/` — `dark.mp3` и `light.mp3`. Их выбрал заказчик, подбирать ничего не нужно.

Музыка зацикливается, громкость — `volume * 0.4`: фон не должен спорить с речью.

**Вес.** Файлы весят 4.3 и 4.7 МБ — это много для телефона, особенно если игру открывают не по вайфаю. Смягчается двумя вещами, обе обязательны:

1. Дорожка грузится **лениво**, только когда тема готова и настроение известно, и только одна из двух. На экране лобби и во время генерации музыки нет.
2. Загрузка не блокирует партию: играть можно, пока файл едет.

Пережимать файлы в этой задаче не нужно — исходники заказчика трогать без спроса не стоит. Но если после проверки в браузере окажется, что дорожка заметно задерживает первый ход на телефоне, запиши это в `OPEN-QUESTIONS.md`: пережать в `ogg` на 96 кбит/с срежет вес вчетверо, и решать это заказчику.

Если поле настроения у темы отсутствует, дорожка выбирается по `isDark` из ролей цвета — то же значение, которым выведена палитра.

- [ ] **Шаг 4: Ползунок**

В нижней полосе справа — `Slider` из `@/components/ui/Slider`, от 0 до 1 с шагом 0.05, привязанный к `settingsStore.general.volume`. Рядом значок громкости, по нажатию — в ноль и обратно к прежнему значению.

- [ ] **Шаг 5: Развести звуки по событиям**

Звук привязывается к изменению присланного состояния, а не к нажатию кнопки: ходы бывают и чужие, и автопилота.

Сравнивать предыдущий и новый `stateId` в `PartyPage`: изменился `lastRoll` — дробь кубика; изменилась позиция любого игрока — шаг; сменилась фаза на `CHOICE` — открытие события; изменился запас ресурса — свой интервал; появился `winner` — трезвучие.

- [ ] **Шаг 6: Проверить и закоммитить**

Проверить, что при нулевой громкости тишина полная, а при обновлении страницы значение сохраняется.

```bash
git add client/src
git commit -m "feat(lucid): звуки действий и регулятор громкости"
```

---

## Задача 17: Проверка партии в браузере

Прямое поручение заказчика: после реализации проверить всю работу игры через DevTools. Выполнимо только теперь, когда интерфейс есть.

**Файлы:**
- Создать: `docs/lucid/CHECK.md`

- [ ] **Шаг 1: Поднять окружение**

Выполнить `yarn start:dev`. Сервер на 4001, клиент на 3000.

Ключ OpenRouter должен лежать в окружении сервера. Если ключа нет — партия уйдёт на запасную, и это **тоже подлежит проверке**, но отдельным прогоном: сначала проверь запасную партию, потом настоящую генерацию.

- [ ] **Шаг 2: Пройти партию вдвоём**

Через chrome-devtools: две вкладки, вторая в режиме инкогнито (иначе совпадёт идентификатор игрока).

Проверить по порядку:
1. Создание партии, переход по адресу, ввод ника.
2. Второй игрок входит по той же ссылке и виден в составе.
3. Оба предлагают темы, предложения видны обоим.
4. Запуск доступен только создателю.
5. Ожидание: сначала название мира и перекраска, затем поле.
6. Броски, движение фишек, открытие событий, выбор вариантов.
7. Развилка: выбор ветки и с поля, и кнопкой.
8. Обрыв связи: закрыть одну вкладку в свой ход, через 30 секунд ходит автопилот, в ленте появляется строка.
9. Возвращение: открыть адрес заново тем же браузером — место сохранилось.
10. Победа и «сыграть ещё».

- [ ] **Шаг 3: Проверить, что нельзя подсмотреть**

В консоли вкладки выполнить проверку: в присланном состоянии нет ни состояния генератора, ни содержимого непройденных клеток.

```js
// Ожидается: false и 0 соответственно
JSON.stringify(window.performance.getEntries()).includes('random');
```

Надёжнее — во вкладке «Сеть» посмотреть кадры вебсокета: в сообщении `update-party` не должно быть поля `random` и не должно быть событий с номерами клеток, которых нет в `visited`.

- [ ] **Шаг 4: Проверить телефонную раскладку**

Эмулировать ширину 360 пикселей. Горизонтальной прокрутки нет, поле читается, карточка события разворачивается и сворачивается, все действия доступны. Телефон не получает урезанную игру: если что-то доступно на десктопе и недоступно на телефоне — это ошибка, а не компромисс.

- [ ] **Шаг 5: Собрать консоль**

Ошибок и предупреждений React в консоли быть не должно. Всё найденное записать.

- [ ] **Шаг 6: Записать результат**

`docs/lucid/CHECK.md` — что проверено, что сломалось, что осталось. Найденные дефекты чинить сразу, если они мелкие; крупные записывать в `OPEN-QUESTIONS.md` и продолжать.

- [ ] **Шаг 7: Коммит**

```bash
git add docs/lucid
git commit -m "docs(lucid): записать результат проверки партии в браузере"
```

---

## Что этот план сознательно не делает

- **Зрителей нет.** Роль зрителя потребовала бы третьего вида состояния рядом с полным серверным и урезанным для игрока, и решать пришлось бы, видит ли он непройденные клетки.
- **Итогов партии нет.** Считать их не из чего: полная история не хранится.
- **Сводки «что было, пока тебя не было» нет.** Она требовала бы помнить ходы за произвольный промежуток.
- **Списка открытых партий нет.** Игра рассчитана на компанию, которая уже договорилась играть.
- **Аналитики нет.** PostHog в России не работает.
- **Storybook пишется только для поля.** Экраны целиком зависят от присланного вида и сгенерированной палитры, и отдельные истории для них стоили бы дороже пользы. У поля причина обратная: его облик нужно показать до того, как поверх лягут остальные экраны. Проверяемые части — цвет и раскладка — покрыты тестами, а не историями.
