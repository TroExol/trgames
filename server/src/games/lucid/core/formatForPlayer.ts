import type { LucidShared } from '@trgames/shared';

// Единственное место, решающее, что игрок видит. Новое секретное поле
// прячется здесь, а не в каждой сущности по отдельности
export interface TStateForPlayer {
  G: Omit<LucidShared.TG, 'random'>;
  ctx: LucidShared.TCtx;
  stateId: number;
  you: LucidShared.TPlayerId;
}

export const formatForPlayer = (
  state: LucidShared.TState,
  playerId: LucidShared.TPlayerId,
): TStateForPlayer => {
  const opened = Object.fromEntries(
    Object.entries(state.G.events).filter(([cellId]) => state.G.visited.includes(Number(cellId))),
  );

  // Состояние генератора случайных чисел не должно попадать игроку
  const G = Object.fromEntries(
    Object.entries(state.G).filter(([key]) => key !== 'random'),
  ) as Omit<LucidShared.TG, 'random'>;

  return {
    G: { ...G, events: opened },
    ctx: state.ctx,
    stateId: state.stateId,
    you: playerId,
  };
};
