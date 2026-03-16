# Аналитика TRGames — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить продуктовую и техническую аналитику через PostHog с абстракцией, позволяющей заменить провайдер.

**Architecture:** Enum'ы событий и страниц в shared workspace. На клиенте — `LocalStorageService` (обёртка localStorage), `AnalyticsService` (абстракция над PostHog), `AnalyticsProvider` (React-провайдер). Интеграция через вызовы `analytics.track()` / `analytics.page()` в SocketService и layout-компонентах.

**Tech Stack:** PostHog Cloud (posthog-js, @posthog/react), TypeScript, React 18, MobX, Socket.io

**Design doc:** `docs/plans/2026-03-15-analytics-design.md`

---

### Task 1: Enum EGame в shared

**Files:**
- Create: `tools/shared/src/games/types.ts`
- Modify: `tools/shared/src/index.ts`

**Step 1: Создать enum EGame**

```ts
// tools/shared/src/games/types.ts
export enum EGame {
  CRYPTOZ = 'cryptoz',
}
```

**Step 2: Экспортировать из index.ts**

В `tools/shared/src/index.ts` добавить:
```ts
export * from './games/types';
```

**Step 3: Проверить typecheck**

Run: `yarn workspace @trgames/shared lint`
Expected: PASS

**Step 4: Commit**

```bash
git add tools/shared/src/games/types.ts tools/shared/src/index.ts
git commit -m "Добавил enum EGame в shared"
```

---

### Task 2: Общие enum'ы аналитики в shared

**Files:**
- Create: `tools/shared/src/analytics/events.ts`
- Create: `tools/shared/src/analytics/pages.ts`
- Modify: `tools/shared/src/index.ts`

**Step 1: Создать общие события**

```ts
// tools/shared/src/analytics/events.ts
export enum EAnalyticsEvent {
  ERROR_OCCURRED = 'error_occurred',
  WEBSOCKET_DISCONNECTED = 'websocket_disconnected',
  WEBSOCKET_RECONNECTED = 'websocket_reconnected',
}
```

**Step 2: Создать общие страницы**

```ts
// tools/shared/src/analytics/pages.ts
export enum EAnalyticsPage {
  GAMES = 'games',
}
```

**Step 3: Экспортировать из index.ts**

В `tools/shared/src/index.ts` добавить:
```ts
export * from './analytics/events';
export * from './analytics/pages';
```

**Step 4: Проверить typecheck**

Run: `yarn workspace @trgames/shared lint`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/shared/src/analytics/ tools/shared/src/index.ts
git commit -m "Добавил общие enum'ы аналитики (EAnalyticsEvent, EAnalyticsPage)"
```

---

### Task 3: Enum'ы аналитики Cryptoz в shared

**Files:**
- Create: `tools/shared/src/games/cryptoz/analytics/events.ts`
- Create: `tools/shared/src/games/cryptoz/analytics/pages.ts`
- Modify: `tools/shared/src/games/cryptoz/index.ts`

**Step 1: Создать события Cryptoz**

```ts
// tools/shared/src/games/cryptoz/analytics/events.ts
export enum ECryptozAnalyticsEvent {
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_REMOVED = 'room_removed',
  PLAYER_REMOVED = 'player_removed',
  GAME_STARTED = 'game_started',
  GAME_ENDED = 'game_ended',
  CARD_PLAYED = 'card_played',
  ABILITY_PLAYED = 'ability_played',
  CARD_BOUGHT_MARKET = 'card_bought_market',
  CARD_BOUGHT_COMPANION = 'card_bought_companion',
  CARD_BOUGHT_HARBINGER = 'card_bought_harbinger',
  CARD_BOUGHT_DARKNESS_MADNESS = 'card_bought_darkness_madness',
  TURN_ENDED = 'turn_ended',
  PLAYER_READY_TOGGLED = 'player_ready_toggled',
  MESSAGE_SENT = 'message_sent',
  MODAL_SHOWN = 'modal_shown',
  MODAL_RESPONDED = 'modal_responded',
}
```

**Step 2: Создать страницы Cryptoz**

```ts
// tools/shared/src/games/cryptoz/analytics/pages.ts
export enum ECryptozAnalyticsPage {
  ROOMS = 'rooms',
  ROOM = 'room',
  RULES = 'rules',
  UPDATES = 'updates',
}
```

**Step 3: Экспортировать из cryptoz/index.ts**

В `tools/shared/src/games/cryptoz/index.ts` добавить:
```ts
export * from './analytics/events';
export * from './analytics/pages';
```

**Step 4: Проверить typecheck**

Run: `yarn workspace @trgames/shared lint`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/shared/src/games/cryptoz/analytics/ tools/shared/src/games/cryptoz/index.ts
git commit -m "Добавил enum'ы аналитики Cryptoz (ECryptozAnalyticsEvent, ECryptozAnalyticsPage)"
```

---

### Task 4: Типизация properties событий Cryptoz

**Files:**
- Modify: `tools/shared/src/games/cryptoz/analytics/events.ts`

**Step 1: Добавить mapped type для properties**

В конец `tools/shared/src/games/cryptoz/analytics/events.ts` добавить типы properties для каждого события. Использовать существующие типы: `EGame` из `../../types`, `ECardId` из `../types/card`, `TAbilityId` из `../types/ability`, `EModalTypes` из `../types/modal`, `TStoneShardId` из `../types/stoneShard`.

```ts
import type { TAbilityId } from '../types/ability';
import type { ECardId } from '../types/card';
import type { EModalTypes } from '../types/modal';
import type { TStoneShardId } from '../types/stoneShard';

import { EGame } from '../../types';

export type TCryptozAnalyticsEventProperties = {
  [ECryptozAnalyticsEvent.ROOM_CREATED]: { game: EGame; roomId: string };
  [ECryptozAnalyticsEvent.ROOM_JOINED]: { game: EGame; roomId: string; isViewer: boolean };
  [ECryptozAnalyticsEvent.ROOM_LEFT]: { game: EGame; roomId: string };
  [ECryptozAnalyticsEvent.ROOM_REMOVED]: { game: EGame; roomId: string; reason: 'admin' | 'empty' };
  [ECryptozAnalyticsEvent.PLAYER_REMOVED]: { game: EGame; roomId: string };
  [ECryptozAnalyticsEvent.GAME_STARTED]: { game: EGame; roomId: string; playerCount: number };
  [ECryptozAnalyticsEvent.GAME_ENDED]: { game: EGame; roomId: string; durationMs: number; playerCount: number };
  [ECryptozAnalyticsEvent.CARD_PLAYED]: { game: EGame; cardId: ECardId };
  [ECryptozAnalyticsEvent.ABILITY_PLAYED]: { game: EGame; abilityId: TAbilityId };
  [ECryptozAnalyticsEvent.CARD_BOUGHT_MARKET]: { game: EGame; cardId: ECardId };
  [ECryptozAnalyticsEvent.CARD_BOUGHT_COMPANION]: { game: EGame };
  [ECryptozAnalyticsEvent.CARD_BOUGHT_HARBINGER]: { game: EGame };
  [ECryptozAnalyticsEvent.CARD_BOUGHT_DARKNESS_MADNESS]: { game: EGame };
  [ECryptozAnalyticsEvent.TURN_ENDED]: { game: EGame; roomId: string };
  [ECryptozAnalyticsEvent.PLAYER_READY_TOGGLED]: { game: EGame };
  [ECryptozAnalyticsEvent.MESSAGE_SENT]: { game: EGame };
  [ECryptozAnalyticsEvent.MODAL_SHOWN]: {
    game: EGame;
    modalType: EModalTypes;
    title?: string;
    cardsCount?: number;
    variants?: string[];
    cardAttackId?: ECardId;
  };
  [ECryptozAnalyticsEvent.MODAL_RESPONDED]: {
    game: EGame;
    modalType: EModalTypes;
    selectedVariantId?: string | number;
    selectedCardIds?: ECardId[];
    selectedShardIds?: TStoneShardId[];
    closed: boolean;
  };
};
```

**Примечание:** порядок импортов — сначала type-импорты, затем value-импорты, по алфавиту (правила проекта: perfectionist).

**Step 2: Проверить typecheck**

Run: `yarn workspace @trgames/shared lint`
Expected: PASS

**Step 3: Commit**

```bash
git add tools/shared/src/games/cryptoz/analytics/events.ts
git commit -m "Добавил типизацию properties для событий аналитики Cryptoz"
```

---

### Task 5: Установить зависимости PostHog

**Step 1: Установить пакеты**

Run: `yarn workspace @trgames/client add posthog-js @posthog/react`

**Step 2: Добавить env-переменную**

В `client/.env` добавить строку:
```
VITE_POSTHOG_KEY=
```

Оставить пустым — ключ будет добавлен после регистрации в PostHog.

**Step 3: Добавить VITE_POSTHOG_KEY в типы Vite (если есть env.d.ts)**

Проверить наличие `client/src/vite-env.d.ts` или `client/env.d.ts`. Если есть — добавить `VITE_POSTHOG_KEY: string`.

**Step 4: Commit**

```bash
git add client/package.json yarn.lock client/.env
git commit -m "Установил posthog-js и @posthog/react"
```

---

### Task 6: LocalStorageService

**Files:**
- Create: `client/src/services/LocalStorageService.ts`
- Create: `client/src/services/index.ts`

**Step 1: Создать LocalStorageService**

```ts
// client/src/services/LocalStorageService.ts
class LocalStorageService {
  private readonly cache = new Map<string, string>();
  private readonly isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  public get(key: string): string | null {
    if (this.isAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fallthrough к кэшу
      }
    }
    return this.cache.get(key) ?? null;
  }

  public set(key: string, value: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallthrough к кэшу (quota exceeded и т.п.)
      }
    }
    this.cache.set(key, value);
  }

  public remove(key: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallthrough к кэшу
      }
    }
    this.cache.delete(key);
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const testKey = '__trgames_storage_test__';
    try {
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const localStorageService = new LocalStorageService();
```

**Step 2: Создать index.ts**

```ts
// client/src/services/index.ts
export { localStorageService } from './LocalStorageService';
```

**Step 3: Проверить typecheck**

Run: `yarn workspace @trgames/client build`
Expected: PASS (tsc --noEmit + vite build)

**Step 4: Commit**

```bash
git add client/src/services/
git commit -m "Добавил LocalStorageService с fallback на in-memory кэш"
```

---

### Task 7: AnalyticsService

**Files:**
- Create: `client/src/services/AnalyticsService.ts`
- Modify: `client/src/services/index.ts`

**Step 1: Создать AnalyticsService**

```ts
// client/src/services/AnalyticsService.ts
import type {
  EAnalyticsEvent,
  EAnalyticsPage,
  ECryptozAnalyticsEvent,
  ECryptozAnalyticsPage,
} from '@trgames/shared';

import posthog from 'posthog-js';

import { localStorageService } from './LocalStorageService';

type TAnalyticsEvent = EAnalyticsEvent | ECryptozAnalyticsEvent;
type TAnalyticsPage = EAnalyticsPage | ECryptozAnalyticsPage;

const ANALYTICS_ID_KEY = 'trgames:analytics-id';

class AnalyticsService {
  private initialized = false;

  public init(apiKey: string, apiHost: string): void {
    if (this.initialized || !apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      persistence: 'localStorage',
    });

    const distinctId = this.getOrCreateDistinctId();
    posthog.identify(distinctId);

    this.initialized = true;
  }

  public track(event: TAnalyticsEvent, properties?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    posthog.capture(event, properties);
  }

  public identify(traits?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    const distinctId = this.getOrCreateDistinctId();
    posthog.identify(distinctId, traits);
  }

  public page(name: TAnalyticsPage, properties?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    posthog.capture('$pageview', { pageName: name, ...properties });
  }

  public reset(): void {
    if (!this.initialized) {
      return;
    }
    posthog.reset();
  }

  private getOrCreateDistinctId(): string {
    let id = localStorageService.get(ANALYTICS_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorageService.set(ANALYTICS_ID_KEY, id);
    }
    return id;
  }
}

export const analyticsService = new AnalyticsService();
```

**Примечания:**
- `crypto.randomUUID()` — встроен в браузеры, не нужна зависимость `uuid`
- `persistence: 'localStorage'` — PostHog будет хранить свои данные в localStorage
- Если `apiKey` пустой — аналитика не инициализируется (для локальной разработки)

**Step 2: Добавить экспорт в index.ts**

В `client/src/services/index.ts` добавить:
```ts
export { analyticsService } from './AnalyticsService';
```

**Step 3: Проверить typecheck**

Run: `yarn workspace @trgames/client build`
Expected: PASS

**Step 4: Commit**

```bash
git add client/src/services/AnalyticsService.ts client/src/services/index.ts
git commit -m "Добавил AnalyticsService — абстракция над PostHog"
```

---

### Task 8: AnalyticsProvider

**Files:**
- Create: `client/src/providers/AnalyticsProvider/index.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Создать AnalyticsProvider**

```tsx
// client/src/providers/AnalyticsProvider/index.tsx
import type { FC, ReactNode } from 'react';

import { PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { analyticsService } from '@/services';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string;
const POSTHOG_HOST = 'https://us.i.posthog.com';

interface TProps {
  children: ReactNode;
}

export const AnalyticsProvider: FC<TProps> = ({ children }) => {
  useEffect(() => {
    analyticsService.init(POSTHOG_KEY, POSTHOG_HOST);
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
};
```

**Примечание:** если `VITE_POSTHOG_KEY` не задан — провайдер просто рендерит children без PostHog. Так локальная разработка не ломается.

**Step 2: Обернуть App.tsx**

В `client/src/App.tsx` (строки 28-37) обернуть содержимое в `AnalyticsProvider`:

Было:
```tsx
return (
  <ThemeProvider>
    <GameThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </GameThemeProvider>
  </ThemeProvider>
);
```

Стало:
```tsx
return (
  <AnalyticsProvider>
    <ThemeProvider>
      <GameThemeProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </GameThemeProvider>
    </ThemeProvider>
  </AnalyticsProvider>
);
```

Добавить импорт: `import { AnalyticsProvider } from '@/providers/AnalyticsProvider';`

**Step 3: Проверить typecheck**

Run: `yarn workspace @trgames/client build`
Expected: PASS

**Step 4: Commit**

```bash
git add client/src/providers/AnalyticsProvider/ client/src/App.tsx
git commit -m "Добавил AnalyticsProvider и подключил в App.tsx"
```

---

### Task 9: Глобальный error tracking

**Files:**
- Modify: `client/src/providers/AnalyticsProvider/index.tsx`

**Step 1: Добавить глобальные обработчики ошибок**

В `AnalyticsProvider` внутри `useEffect` после `analyticsService.init()` добавить подписку на глобальные ошибки:

```tsx
useEffect(() => {
  analyticsService.init(POSTHOG_KEY, POSTHOG_HOST);

  const handleError = (event: ErrorEvent) => {
    analyticsService.track(EAnalyticsEvent.ERROR_OCCURRED, {
      message: event.message,
      stack: event.error?.stack,
      page: window.location.pathname,
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    analyticsService.track(EAnalyticsEvent.ERROR_OCCURRED, {
      message: String(event.reason),
      stack: event.reason?.stack,
      page: window.location.pathname,
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}, []);
```

Добавить импорт: `import { EAnalyticsEvent } from '@trgames/shared';`

**Step 2: Проверить typecheck**

Run: `yarn workspace @trgames/client build`
Expected: PASS

**Step 3: Commit**

```bash
git add client/src/providers/AnalyticsProvider/index.tsx
git commit -m "Добавил глобальный error tracking в AnalyticsProvider"
```

---

### Task 10: Трекинг страниц

**Files:**
- Modify: `client/src/routes/GamesPage/index.tsx` (или где lazy export Component)
- Modify: `client/src/routes/games/cryptoz/RoomsPage/index.tsx`
- Modify: `client/src/routes/games/cryptoz/RoomPage/index.tsx`
- Modify: `client/src/routes/games/cryptoz/RulesPage/index.tsx`
- Modify: `client/src/routes/games/cryptoz/UpdatesPage/index.tsx`

**Step 1: Найти компоненты страниц**

Каждая страница экспортирует `Component` через lazy loading. Нужно добавить `useEffect` с вызовом `analyticsService.page()`.

**Step 2: Добавить трекинг в каждую страницу**

Паттерн для каждой страницы — добавить в начало компонента:

```tsx
import { useEffect } from 'react'; // если ещё не импортирован
import { EAnalyticsPage } from '@trgames/shared'; // или ECryptozAnalyticsPage для игровых
import { CryptozShared } from '@trgames/shared'; // уже импортирован в игровых страницах
import { analyticsService } from '@/services';

// Внутри компонента:
useEffect(() => {
  analyticsService.page(EAnalyticsPage.GAMES);
}, []);
```

Для каждой страницы:
- `GamesPage` → `EAnalyticsPage.GAMES`
- `RoomsPage` → `CryptozShared.ECryptozAnalyticsPage.ROOMS`
- `RoomPage` → `CryptozShared.ECryptozAnalyticsPage.ROOM` с `{ roomId: roomUuid }` из URL params
- `RulesPage` → `CryptozShared.ECryptozAnalyticsPage.RULES`
- `UpdatesPage` → `CryptozShared.ECryptozAnalyticsPage.UPDATES`

**Step 3: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 4: Commit**

```bash
git add client/src/routes/
git commit -m "Добавил трекинг страниц через analyticsService.page()"
```

---

### Task 11: Трекинг WebSocket в SocketService (RoomsPage)

**Files:**
- Modify: `client/src/routes/games/cryptoz/RoomsPage/services/SocketService.ts`

**Step 1: Добавить трекинг событий**

В файле `client/src/routes/games/cryptoz/RoomsPage/services/SocketService.ts`:

1. Добавить импорты:
```ts
import { EAnalyticsEvent, EGame } from '@trgames/shared';
import { analyticsService } from '@/services';
```

2. В обработчике `disconnect` (строка 39-43) добавить:
```ts
analyticsService.track(EAnalyticsEvent.WEBSOCKET_DISCONNECTED, {
  game: EGame.CRYPTOZ,
  reason,
});
```

3. В обработчике `connect` (строка 24-28) добавить:
```ts
analyticsService.track(EAnalyticsEvent.WEBSOCKET_RECONNECTED, {
  game: EGame.CRYPTOZ,
});
```
Но только при reconnect, не при первом connect. Для этого добавить флаг `private hasConnected = false` в класс. В `connect` — если `hasConnected === true`, трекаем reconnect. Иначе ставим `hasConnected = true`.

4. В `createRoom` (строка 54-77) после `resolve(params.uuid)` добавить:
```ts
analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.ROOM_CREATED, {
  game: EGame.CRYPTOZ,
  roomId: params.uuid,
});
```

**Step 2: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 3: Commit**

```bash
git add client/src/routes/games/cryptoz/RoomsPage/services/SocketService.ts
git commit -m "Добавил трекинг WebSocket и создания комнат в RoomsPage SocketService"
```

---

### Task 12: Трекинг событий в SocketService (RoomPage)

**Files:**
- Modify: `client/src/routes/games/cryptoz/RoomPage/services/SocketService/SocketService.ts`

**Step 1: Добавить импорты**

```ts
import { EAnalyticsEvent, EGame } from '@trgames/shared';
import { analyticsService } from '@/services';
```

**Step 2: WebSocket трекинг**

Аналогично Task 11 — трекинг `disconnect` и reconnect в обработчиках `connect` и `disconnect` (строки 43-66). Добавить флаг `private hasConnected = false`.

**Step 3: Трекинг игровых действий**

В каждый публичный метод (emit) добавить вызов `analyticsService.track()`:

- `sendMessage` (строка 234-236):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.MESSAGE_SENT, { game: EGame.CRYPTOZ });
  ```

- `playCard` (строка 238-240):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.CARD_PLAYED, { game: EGame.CRYPTOZ, cardId: card.id });
  ```

- `playAbility` (строка 242-244):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.ABILITY_PLAYED, { game: EGame.CRYPTOZ, abilityId: ability.id });
  ```

- `toggleReady` (строка 246-248):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.PLAYER_READY_TOGGLED, { game: EGame.CRYPTOZ });
  ```

- `removePlayer` (строка 250-252):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.PLAYER_REMOVED, { game: EGame.CRYPTOZ, roomId: this.getRoomId() });
  ```
  Нужно добавить helper `private getRoomId()` который достаёт roomId из URL или из `roomStore`.

- `buyMarketCard` (строка 254-256):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.CARD_BOUGHT_MARKET, { game: EGame.CRYPTOZ, cardId: card.id });
  ```

- `buyCompanion` (строка 258-260):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.CARD_BOUGHT_COMPANION, { game: EGame.CRYPTOZ });
  ```

- `buyHarbinger` (строка 262-264):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.CARD_BOUGHT_HARBINGER, { game: EGame.CRYPTOZ });
  ```

- `buyDarknessMadness` (строка 266-268):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.CARD_BOUGHT_DARKNESS_MADNESS, { game: EGame.CRYPTOZ });
  ```

- `endTurn` (строка 270-272):
  ```ts
  analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.TURN_ENDED, { game: EGame.CRYPTOZ, roomId: this.getRoomId() });
  ```

**Step 4: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/routes/games/cryptoz/RoomPage/services/SocketService/SocketService.ts
git commit -m "Добавил трекинг игровых действий и WebSocket в RoomPage SocketService"
```

---

### Task 13: Трекинг модалок

**Files:**
- Modify: `client/src/routes/games/cryptoz/RoomPage/services/SocketService/SocketService.ts`

**Step 1: Трекинг MODAL_SHOWN**

В каждый обработчик `showModal*` добавить `analyticsService.track(ECryptozAnalyticsEvent.MODAL_SHOWN, ...)` сразу после получения данных от сервера:

- `showModalCards` (строка 84-98): modalType `EModalTypes.cards`, `title`, `cardsCount: cards.length`
- `showModalEndGame` (строка 100-106): modalType `EModalTypes.endGame`
- `showModalSelectStartCards` (строка 108-122): modalType `EModalTypes.selectStartCards`, `cardsCount: companions.length`
- `showModalSelectCards` (строка 124-151): modalType `EModalTypes.selectCards`, `title`, `cardsCount: cards.length`, `variants: variants.map(v => String(v.id))`
- `showModalSelectStoneShards` (строка 153-178): modalType `EModalTypes.selectStoneShards`, `title`, `cardsCount: stoneShards.length`
- `showModalSelectVariant` (строка 180-201): modalType `EModalTypes.selectVariant`, `title`, `variants: variants.map(v => String(v.id))`
- `showModalSuggestEvade` (строка 203-230): modalType `EModalTypes.suggestEvade`, `title`, `cardsCount: cards.length`, `cardAttackId: cardAttack.id`

**Step 2: Трекинг MODAL_RESPONDED**

В каждый `callback` и `onClose`/`onSubmit` — трекинг ответа:

Для модалок с `onClose` и `onSubmit`:
- `onClose`: `analyticsService.track(ECryptozAnalyticsEvent.MODAL_RESPONDED, { game: EGame.CRYPTOZ, modalType, closed: true })`
- `onSubmit`: `analyticsService.track(ECryptozAnalyticsEvent.MODAL_RESPONDED, { game: EGame.CRYPTOZ, modalType, closed: false, selectedVariantId: id, selectedCardIds: selectedCards?.map(c => c.id) })`

Для `selectStartCards` (нет onClose — обязательный выбор):
- `onSubmit`: `{ closed: false, selectedCardIds: [companion.id] }`

**Step 3: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 4: Commit**

```bash
git add client/src/routes/games/cryptoz/RoomPage/services/SocketService/SocketService.ts
git commit -m "Добавил трекинг показа и ответов модалок"
```

---

### Task 14: Трекинг identify и room events в RoomPage

**Files:**
- Modify: `client/src/routes/games/cryptoz/RoomPage/index.tsx`

**Step 1: Добавить identify при входе в комнату**

В `RoomPage` компоненте после успешного подключения к комнате — вызвать `analyticsService.identify({ nickname })` и `analyticsService.track(ECryptozAnalyticsEvent.ROOM_JOINED, ...)`.

Найти место где вызывается `socketService.connect()` (может быть в отдельном файле — проверить). Добавить identify после resolve промиса.

**Step 2: Трекинг ROOM_LEFT**

В `useUnmount` (строка 81-86 в `RoomPage/index.tsx`) перед `socketService.close()` добавить:
```ts
analyticsService.track(CryptozShared.ECryptozAnalyticsEvent.ROOM_LEFT, {
  game: EGame.CRYPTOZ,
  roomId: roomStore.room.uuid,
});
```

**Step 3: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 4: Commit**

```bash
git add client/src/routes/games/cryptoz/RoomPage/
git commit -m "Добавил identify при входе в комнату и трекинг ROOM_JOINED/ROOM_LEFT"
```

---

### Task 15: Миграция SettingsStore на LocalStorageService

**Files:**
- Modify: `client/src/stores/SettingsStore.ts`

**Step 1: Заменить прямые вызовы localStorage**

В `client/src/stores/SettingsStore.ts`:

1. Добавить импорт:
```ts
import { localStorageService } from '@/services';
```

2. В `loadFromStorage` (строка 39-71) заменить `window.localStorage.getItem(this.storageKey)` на `localStorageService.get(this.storageKey)`. Убрать проверку `typeof window === 'undefined'` и try/catch — `LocalStorageService` обрабатывает это внутри.

3. В `saveToStorage` (строка 74-91) заменить `window.localStorage.setItem(...)` на `localStorageService.set(this.storageKey, JSON.stringify(payload))`. Убрать проверку `typeof window` и try/catch.

**Step 2: Проверить lint**

Run: `yarn workspace @trgames/client lint`
Expected: PASS

**Step 3: Commit**

```bash
git add client/src/stores/SettingsStore.ts
git commit -m "Мигрировал SettingsStore на LocalStorageService"
```

---

### Task 16: Финальная проверка

**Step 1: Полный lint**

Run: `yarn lint`
Expected: PASS (все воркспейсы)

**Step 2: Проверить сборку**

Run: `yarn workspace @trgames/client build`
Expected: PASS

**Step 3: Ручная проверка**

1. Запустить `yarn start:dev`
2. Открыть `http://localhost:3000`
3. Убедиться что приложение работает без ошибок в консоли
4. Если `VITE_POSTHOG_KEY` пустой — аналитика не инициализируется, приложение работает как раньше

**Step 4: Финальный commit (если есть незакоммиченные файлы)**

```bash
git add -A
git commit -m "Финальные правки после проверки аналитики"
```
