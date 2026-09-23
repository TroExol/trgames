import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

// Ключ провайдера и имя модели живут в server/.env, как VITE_API_BASE_URL
// живёт в client/.env. Загрузчик свой, а не пакетом: правил разбора здесь
// ровно два, а Node умеет --env-file только флагом, который nodemon
// до процесса не доносит
export const loadEnv = (fileName = '.env'): void => {
  const path = resolve(process.cwd(), fileName);

  if (!existsSync(path)) {
    return;
  }

  readFileSync(path, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separator = trimmed.indexOf('=');

    if (separator <= 0) {
      return;
    }

    const name = trimmed.slice(0, separator).trim();
    // Кавычки вокруг значения снимаем: их ставят по привычке из других
    // загрузчиков, а в значении они не нужны
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');

    // Переменная, заданная снаружи, сильнее файла: иначе нечем перекрыть
    // значение на один запуск
    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  });
};
