import type { LucidShared } from '@trgames/shared';

// @trgames/shared отдаёт этот тип только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
export type TStateForPlayer = LucidShared.TStateForPlayer;

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
  // случайных чисел не попадёт к игроку: зная его, он предсказал бы все броски.
  // Журнал партии тоже не отдаётся целиком — лента собирается из его прироста
  // на стороне комнаты (см. Party.takeRibbonDelta)
  const G: Omit<LucidShared.TG, 'log' | 'random'> = {
    players: state.G.players,
    order: state.G.order,
    track: state.G.track,
    events: opened,
    theme: state.G.theme,
    visited: state.G.visited,
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
