import type { Party } from '@/games/lucid/room/Party';

// Сколько опустевшая партия ждёт, прежде чем её удалят. Запас к окну
// автопилота (тридцать секунд) взят намеренно: мы обещали, что потерявший
// связь сохраняет место, а партия переживает перезапуск сервера. Удаление в
// тот же миг, когда отвалился последний, уничтожало бы партию у четверых,
// одновременно обновивших вкладку, — обычное дело после деплоя или при
// дёрнувшемся вайфае
export const CLEANUP_DELAY_MS = 300_000;

interface TCreateCleanupParams {
  // Удаление отдано вызывающему: кроме самой партии снимать приходится и
  // её автопилот, а о нём здесь знать незачем
  remove: (uuid: string) => void;
}

export const createCleanup = ({ remove }: TCreateCleanupParams) => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    // Состояние проверяется после каждой рассылки, а не заводится на событие
    // обрыва: так срок один на партию, а не один на отключение
    sync: (party: Party): void => {
      const pending = timers.get(party.uuid);

      if (party.hasConnected) {
        if (pending) {
          clearTimeout(pending);
          timers.delete(party.uuid);
        }

        return;
      }

      // Отсчёт идёт от момента, когда партия опустела: повторная проверка
      // заведённый срок не перевзводит. Иначе ходящий за отсутствующих
      // автопилот откладывал бы удаление до самого конца партии
      if (pending) {
        return;
      }

      timers.set(party.uuid, setTimeout(() => {
        timers.delete(party.uuid);
        remove(party.uuid);
      }, CLEANUP_DELAY_MS));
    },
  };
};

export type TCleanup = ReturnType<typeof createCleanup>;
