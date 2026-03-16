# Аналитика TRGames — Design Document

## Цель

Добавить продуктовую и техническую аналитику для отслеживания взаимодействия пользователей с игрой и площадкой.

**Фаза A (сейчас):** MAU/DAU, retention, воронки, ошибки, WebSocket-мониторинг, игровые действия и модалки.
**Фаза B (будущее):** Поведенческая аналитика (популярные стратегии, средняя длительность партии и т.д.).

## Выбранный инструмент

**PostHog Cloud (free tier)** — all-in-one решение.

- 1M событий/месяц
- Воронки, retention, MAU/DAU, дашборды, session replay, error tracking
- Один SDK, готовые кастомизируемые дашборды
- Абстракция позволяет заменить на Mixpanel/Метрику + Sentry без изменения вызовов в коде

## Архитектура

### Shared (tools/shared/src)

Enum'ы для типобезопасного трекинга. Разделение: общие + по играм.

```
tools/shared/src/
├── analytics/
│   ├── events.ts              — EAnalyticsEvent (общие: ERROR_OCCURRED, WEBSOCKET_*)
│   └── pages.ts               — EAnalyticsPage (общие: GAMES)
├── games/
│   ├── types.ts               — EGame { CRYPTOZ = 'cryptoz' }
│   └── cryptoz/
│       └── analytics/
│           ├── events.ts      — ECryptozAnalyticsEvent
│           └── pages.ts       — ECryptozAnalyticsPage
```

#### EAnalyticsEvent (общие)

| Событие | Описание |
|---------|----------|
| `ERROR_OCCURRED` | Необработанная JS-ошибка |
| `WEBSOCKET_DISCONNECTED` | Socket.io disconnect |
| `WEBSOCKET_RECONNECTED` | Socket.io reconnect |

#### EAnalyticsPage (общие)

| Страница | Описание |
|----------|----------|
| `GAMES` | Главная — список игр |

#### ECryptozAnalyticsEvent

| Событие | Properties |
|---------|-----------|
| `ROOM_CREATED` | `game: EGame`, `roomId` |
| `ROOM_JOINED` | `game`, `roomId`, `isViewer` |
| `ROOM_LEFT` | `game`, `roomId` |
| `ROOM_REMOVED` | `game`, `roomId`, `reason: 'admin' \| 'empty'` |
| `PLAYER_REMOVED` | `game`, `roomId` |
| `GAME_STARTED` | `game`, `roomId`, `playerCount` |
| `GAME_ENDED` | `game`, `roomId`, `durationMs`, `playerCount` |
| `CARD_PLAYED` | `game`, `cardId: ECardId` |
| `ABILITY_PLAYED` | `game`, `abilityId` |
| `CARD_BOUGHT_MARKET` | `game`, `cardId: ECardId` |
| `CARD_BOUGHT_COMPANION` | `game` |
| `CARD_BOUGHT_HARBINGER` | `game` |
| `CARD_BOUGHT_DARKNESS_MADNESS` | `game` |
| `TURN_ENDED` | `game`, `roomId` |
| `PLAYER_READY_TOGGLED` | `game` |
| `MESSAGE_SENT` | `game` |
| `MODAL_SHOWN` | `game`, `modalType: EModalTypes`, `title`, `cardsCount?`, `variants?`, `cardAttackId?` |
| `MODAL_RESPONDED` | `game`, `modalType: EModalTypes`, `selectedVariantId?`, `selectedCardIds?`, `selectedShardIds?`, `closed` |

Properties типизированы через mapped type `TCryptozAnalyticsEventProperties` — TypeScript проверяет соответствие события и его полей.

#### ECryptozAnalyticsPage

| Страница | Описание |
|----------|----------|
| `ROOMS` | Список комнат Cryptoz |
| `ROOM` | Игровая комната |
| `RULES` | Правила |
| `UPDATES` | Обновления |

### Client (client/src)

```
client/src/
├── providers/
│   └── AnalyticsProvider/     — PostHogProvider + PostHogErrorBoundary
├── services/
│   ├── AnalyticsService.ts    — интерфейс IAnalyticsProvider + синглтон
│   ├── LocalStorageService.ts — обёртка localStorage с fallback на Map
│   └── index.ts
```

#### IAnalyticsProvider

```ts
interface IAnalyticsProvider {
  init(config: AnalyticsConfig): void;
  track(event: EAnalyticsEvent | ECryptozAnalyticsEvent, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name: EAnalyticsPage | ECryptozAnalyticsPage, properties?: Record<string, unknown>): void;
  reset(): void;
}
```

Абстракция — при замене PostHog меняем только реализацию в `AnalyticsService.ts` и провайдер в `AnalyticsProvider/`.

#### LocalStorageService

Обёртка над `window.localStorage` с:
- Проверкой доступности при инициализации
- try/catch на каждую операцию
- Fallback на `Map` в памяти (приватный режим, quota exceeded)
- Методы: `get`, `set`, `remove`

Используется в `AnalyticsService` (хранение distinctId) и `SettingsStore` (миграция с прямого вызова localStorage).

#### AnalyticsProvider

React-компонент в `client/src/providers/AnalyticsProvider/`. Подключается в `App.tsx` рядом с другими провайдерами.

Содержит:
- `<PostHogProvider>` с конфигурацией
- `<PostHogErrorBoundary>` для отлова render-ошибок
- autocapture включён (дефолт)

### Идентификация пользователей

- UUID генерируется при первом визите, хранится в localStorage (`trgames:analytics-id`) через `LocalStorageService`
- `analytics.identify(distinctId, { nickname })` — при входе в комнату
- Nickname — trait для читаемости в дашбордах, distinctId — для точной склейки

### Трекинг страниц

Вызов `analytics.page()` в layout-компонентах при маунте (`useEffect`).

### Трекинг ошибок

1. `PostHogErrorBoundary` — render-ошибки React
2. `window.onerror` + `window.onunhandledrejection` — глобальные JS-ошибки, трекаем как `ERROR_OCCURRED`

### Трекинг WebSocket

В существующих обработчиках `connect`, `disconnect`, `connect_error` в `SocketService` — вызовы `analytics.track()`.

### Воронка

`PAGE_VIEW(games)` → `PAGE_VIEW(rooms)` → `ROOM_JOINED` → `GAME_STARTED` → `GAME_ENDED`

## Окружение

- Env-переменная: `VITE_POSTHOG_KEY` в `client/.env`
- Новые зависимости: `posthog-js`, `@posthog/react`

## Места интеграции (изменения в существующем коде)

- `App.tsx` — обернуть в `AnalyticsProvider`
- Layout-компоненты — вызовы `analytics.page()`
- `SocketService` (RoomPage) — игровые события, модалки, WebSocket
- `SocketService` (RoomsPage) — создание/удаление комнат
- `SettingsStore` — миграция на `LocalStorageService`
