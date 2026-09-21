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

  // Поля перечислены поимённо намеренно: это список разрешённого, а не запрещённого.
  // Новое поле в состоянии партии не уедет игроку само — оно вызовет ошибку сборки
  // здесь, и показывать его придётся решить осознанно. Так состояние генератора
  // случайных чисел не попадёт к игроку: зная его, он предсказал бы все броски
  const G: Omit<LucidShared.TG, 'random'> = {
    players: state.G.players,
    order: state.G.order,
    track: state.G.track,
    events: opened,
    theme: state.G.theme,
    visited: state.G.visited,
    log: state.G.log,
    winner: state.G.winner,
    branchChoices: state.G.branchChoices,
    pendingSteps: state.G.pendingSteps,
  };

  return {
    G,
    ctx: state.ctx,
    stateId: state.stateId,
    you: playerId,
  };
};
