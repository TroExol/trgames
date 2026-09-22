# TRGames

Настольные игры в онлайн формате. Монорепозиторий на Yarn workspaces.

## Команды

```bash
yarn install              # Установка зависимостей всех воркспейсов
yarn start:dev            # Запуск клиента (3000) и сервера (4001)
yarn lint                 # Линтинг всех воркспейсов
```

### Client (@trgames/client)
```bash
yarn workspace @trgames/client dev          # Vite dev server (порт 3000)
yarn workspace @trgames/client build        # Сборка (tsc + vite build)
yarn workspace @trgames/client lint         # typecheck + eslint + stylelint
yarn workspace @trgames/client storybook    # Storybook (порт 6006)
```

### Server (@trgames/server)
```bash
yarn workspace @trgames/server start:dev    # Nodemon watch mode (порт 4001)
yarn workspace @trgames/server test         # Vitest (все тесты)
yarn workspace @trgames/server test --run src/games/cryptoz/entities/Cards/customCards/CardName.test.ts  # Конкретный тест (флаг --run обязателен)
yarn workspace @trgames/server lint         # typecheck + eslint + тесты
```

Флаг `--run` для запуска одного файла обязателен: скрипт `test` заканчивается флагом `--silent`, и без `--run` путь приклеивается к нему как значение — vitest падает с `Unexpected value "--silent=<путь>"`, не начав работу.

### Shared (@trgames/shared)
```bash
yarn workspace @trgames/shared lint         # typecheck + eslint
```

## Архитектура

```
client/          — React 18 + Vite + MobX + Tailwind + Radix UI + Socket.io Client
server/          — Node.js + Socket.io + i18n-js (только русский)
tools/shared/    — Общие типы TypeScript (CryptozShared namespace)
tools/eslint-plugin-trgames/ — Кастомный ESLint-плагин для валидации карт
prompts/         — Промпты для генерации контента (карточки)
```

## Code style

- Одинарные кавычки, точки с запятой, 2 пробела, max 120 символов
- Стрелочные функции, camelCase переменные
- Импорты: сначала type-импорты, затем по алфавиту (perfectionist)
- 2+ именованных импортов — каждый на новой строке
- Path alias: `@/*` → `./src/*` (в client и server)
- Коммиты и комментарии в коде — на русском
- Pre-commit хук: `yarn lint` (все воркспейсы)

## Тестирование

- Фреймворк: Vitest (сервер и клиент)
- Файлы тестов: `*.test.ts` рядом с тестируемым файлом
- Пример: `server/src/games/cryptoz/entities/Cards/customCards/CardName.test.ts`

## Cryptoz: правила для разработки

### Хаос-карты
Системные карты — должны оставаться только в `room.deck` или `room.removed.chaos`. Не попадают в зоны участников.

### Карточки: создание
- Enum ID в `tools/shared/src/games/cryptoz/types/card.ts` (SCREAMING_SNAKE_CASE)
- Класс карты в `server/src/games/cryptoz/entities/Cards/customCards/` (CamelCase.ts)
- Наследуется от AbstractCard (`server/src/games/cryptoz/entities/Cards/AbstractCard/AbstractCard.ts`)
- Тест рядом с классом (CamelCase.test.ts)
- Если есть strike/totalStrike — добавить возможность укрытия (evade)
- Если есть выбор участника — добавить выбор через модалку
- ESLint проверяет: наличие изображения (.webp) и класса для каждого ECardId

### Модификаторы и триггеры
- Модификаторы: `server/src/games/cryptoz/customModifiers/` — динамические изменения атрибутов
- Триггеры: `server/src/games/cryptoz/customTriggers/` — событийная логика

### Диалоги
- Одновременно: макс 1 активная + 1 свёрнутая модалка
- Управление: `DialogService` + `DialogStore`
- Параметр `count` в диалогах выбора: `0` — запрет, положительное число — ровно столько, `null` — произвольное количество (для карт)

### Настройки клиента
- Стор: `client/src/stores/SettingsStore.ts`
- localStorage ключ: `trgames:client-settings`
- Синхронное сохранение при изменении значений
- Разделение: общие (`general`) и игровые (`cryptoz`) параметры

### i18n
- Только серверная сторона, единственный язык — русский
- Файл переводов: `server/src/i18n/translations/ru.ts`
- ESLint: описания карт без точки в конце, переводы с заглавной буквы

## Lucid

- Перед любой задачей по lucid читать `docs/lucid/PRD.md` — единая точка входа в игру.
- Меняешь поведение lucid — правь `docs/lucid/PRD.md` в том же коммите.

## Переменные окружения

- Client: `VITE_API_BASE_URL` в `client/.env` (инжектится как `__API_BASE_URL__`)
- Server: CLI аргументы `--local true` (CORS *) и `--debug true` (передаётся в
  `start:dev`, сейчас ни на что не влияет — `getProcessArg('--debug')` нигде не вызывается)
