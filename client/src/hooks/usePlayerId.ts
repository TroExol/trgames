import { uid } from 'uid';
import { useState } from 'react';

const STORAGE_KEY = 'trgames:player-id';

// Анонимный идентификатор живёт в браузере и переживает перезагрузку страницы.
// При появлении учётных записей он привяжется к учётке, а не выбросится.
// Читаем и создаём id прямо в инициализаторе useState, а не через useLocalStorage:
// его setValue обёрнут в useEventCallback и бросает исключение при вызове до
// первого коммита — до setPlayerId(created) дело в рендере просто не доходит
export const usePlayerId = (): string => {
  const [playerId] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored) as string;
    }

    const created = uid();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created));

    return created;
  });

  return playerId;
};
