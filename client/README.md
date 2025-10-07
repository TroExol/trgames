# Cryptoz Client

## Настройка переменных окружения

Для работы с API необходимо создать файл `.env` в корне проекта на основе `env.example`:

```bash
cp env.example .env
```

### Переменные окружения

- `VITE_API_BASE_URL` - базовый URL API сервера

### Пример файла .env

```env
# API Configuration
VITE_API_BASE_URL=http://192.168.1.111:4001
```

## Разработка

```bash
# Установка зависимостей
yarn install

# Запуск в режиме разработки
yarn start:dev
``` 