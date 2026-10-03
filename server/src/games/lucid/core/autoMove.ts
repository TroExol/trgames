import { LucidShared } from '@trgames/shared';

// Ход за отсутствующего игрока: кубик, первый кубик на выбор, первая ветка на развилке, первый
// доступный по цене вариант события. Недоступный вариант брать нельзя —
// движок такой ход отклонит, и автопилот застрянет на нём навсегда
export const chooseAutoMove = (state: LucidShared.TState): LucidShared.TMove | null => {
  const playerId = state.ctx.currentPlayer;
  const stateId = state.stateId;

  if (state.ctx.phase === LucidShared.EPhase.ROLL) {
    return { type: LucidShared.EMoveType.ROLL, playerId, stateId };
  }

  if (state.ctx.phase === LucidShared.EPhase.BRANCH) {
    const [cellId] = state.G.branchChoices;

    return cellId === undefined
      ? null
      : { type: LucidShared.EMoveType.CHOOSE_BRANCH, playerId, stateId, cellId };
  }

  if (state.ctx.phase === LucidShared.EPhase.DICE) {
    return { type: LucidShared.EMoveType.CHOOSE_DIE, playerId, stateId, dieIndex: 0 };
  }

  if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
    const player = state.G.players[playerId];
    const options = state.G.events[player.position]?.options ?? [];
    const optionIndex = options.findIndex(option => !option.cost || option.cost <= player.resource);

    return optionIndex === -1
      ? null
      : { type: LucidShared.EMoveType.CHOOSE_OPTION, playerId, stateId, optionIndex };
  }

  return null;
};
