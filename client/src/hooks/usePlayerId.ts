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
