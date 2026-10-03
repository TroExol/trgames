import type { LucidShared } from '@trgames/shared';

// Столько ждём переподключения, прежде чем ходить за игрока. Таймер существует
// против упавшего вайфая, а не против медленных игроков: те, кто на связи,
// думают сколько хотят
export const AUTOPILOT_DELAY_MS = 30_000;

interface TCreateAutopilotParams {
  play: (playerId: LucidShared.TPlayerId) => void;
}

export const createAutopilot = ({ play }: TCreateAutopilotParams) => {
  const timers = new Map<LucidShared.TPlayerId, ReturnType<typeof setTimeout>>();

  const cancel = (playerId: LucidShared.TPlayerId): void => {
    const timer = timers.get(playerId);

    if (timer) {
      clearTimeout(timer);
      timers.delete(playerId);
    }
  };

  return {
    cancel,

    schedule: (playerId: LucidShared.TPlayerId): void => {
      cancel(playerId);
      timers.set(playerId, setTimeout(() => {
        timers.delete(playerId);
        play(playerId);
      }, AUTOPILOT_DELAY_MS));
    },

    stop: (): void => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    },
  };
};

export type TAutopilot = ReturnType<typeof createAutopilot>;
