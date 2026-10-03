[English](./README.md) · **Русский**

<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<h1>TRGames</h1>

**Настольные игры в онлайн формате**

Играйте в настольные игры с друзьями прямо в браузере — без установки, регистрации и скачивания.

<a href="https://github.com/TroExol/trgames/issues/new?labels=bug&template=bug-report---.md">Сообщить об ошибке</a>
&nbsp;&middot;&nbsp;
<a href="https://github.com/TroExol/trgames/issues/new?labels=enhancement&template=feature-request---.md">Предложить идею</a>

</div>

## Игры

- **Cryptoz** — карточная игра с механиками мракобоя, укрытий, печатей, осколков славы и короны Мрака
- **lucid** — бродилка на 2–6 игроков; тему, события и оформление каждой партии генерирует нейросеть

## Стек технологий

| Слой | Технологии |
|------|-----------|
| **Клиент** | React 18, TypeScript, Vite, MobX, Tailwind CSS, Radix UI, Framer Motion |
| **Сервер** | Node.js, Socket.io, i18n-js |
| **Общие типы** | TypeScript (shared workspace) |
| **Тестирование** | Vitest |
| **UI-документация** | Storybook |

## Архитектура

```
trgames/
├── client/                  # React SPA
│   └── src/
│       ├── components/      # Переиспользуемые UI-компоненты (Radix-based)
│       ├── routes/          # Страницы (React Router v6, lazy loading)
│       ├── stores/          # MobX-сторы
│       └── providers/       # Контекст-провайдеры (тема, игровая тема)
├── server/                  # Socket.io сервер
│   └── src/
│       ├── games/cryptoz/   # Игровая логика (карты, модификаторы, триггеры)
│       ├── games/lucid/     # lucid: движок, генерация нейросетью, комнаты
│       └── i18n/            # Локализация (русский)
├── tools/
│   ├── shared/              # Общие TypeScript-типы для клиента и сервера
│   └── eslint-plugin-trgames/  # Кастомный ESLint-плагин
├── docs/lucid/              # PRD, ADR и открытые вопросы lucid
└── prompts/                 # Промпты для генерации контента
```

## Быстрый старт

### Требования

- Node.js v22
- Yarn >= 1.22.22

### Установка и запуск

```bash
git clone https://github.com/TroExol/trgames.git
cd trgames
npm install --global yarn@1.22.22  # если yarn не установлен
yarn install
yarn start:dev
```

Клиент: http://localhost:3000 &nbsp;|&nbsp; Сервер: http://localhost:4001

### Сборка для продакшена

```bash
cd client && yarn build    # Сборка в client/dist
cd ../server && yarn start # Запуск сервера
```

## Разработка

### Полезные команды

| Команда | Описание |
|---------|----------|
| `yarn start:dev` | Запуск клиента и сервера с hot reload |
| `yarn lint` | Проверка кода во всех воркспейсах |
| `yarn workspace @trgames/server test` | Запуск серверных тестов |
| `yarn workspace @trgames/client storybook` | Storybook на порту 6006 |
| `yarn workspace @trgames/server lucid:usage` | Отчёт о стоимости генерации lucid |

### Линтинг

Линтинг автоматически запускается перед коммитом через Husky pre-commit хук.

Для ручного запуска:

```bash
yarn lint                              # Все воркспейсы
yarn workspace @trgames/client lint    # Только клиент
yarn workspace @trgames/server lint    # Только сервер
```

### Переменные окружения

| Переменная | Расположение | Описание |
|-----------|--------------|----------|
| `VITE_API_BASE_URL` | `client/.env` | URL сервера для Socket.io, по умолчанию хост страницы на порту 4001 |
| `OPENROUTER_API_KEY` | `server/.env` | Ключ OpenRouter для генерации lucid |
| `LUCID_MODEL` | `server/.env` | Модель OpenRouter, по умолчанию `deepseek/deepseek-v4.1-flash:nitro` |
| `CORS_ORIGIN` | `server/.env` | Разрешённый CORS origin, по умолчанию `*` |
| `LUCID_DB_PATH` | `server/.env` | Файл базы lucid относительно `server/`, по умолчанию `lucid.db` |

Пример — `server/.env.example`.

## Лицензия

Проект является приватным.

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/TroExol/trgames.svg?style=for-the-badge
[contributors-url]: https://github.com/TroExol/trgames/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/TroExol/trgames.svg?style=for-the-badge
[forks-url]: https://github.com/TroExol/trgames/network/members
[stars-shield]: https://img.shields.io/github/stars/TroExol/trgames.svg?style=for-the-badge
[stars-url]: https://github.com/TroExol/trgames/stargazers
[issues-shield]: https://img.shields.io/github/issues/TroExol/trgames.svg?style=for-the-badge
[issues-url]: https://github.com/TroExol/trgames/issues
