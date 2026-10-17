import { LucidShared } from '@trgames/shared';

import { currentEvent } from '@/games/lucid/core/turn';

const deepestOther = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TPlayerId => {
  const depths = LucidShared.trackDepths(G.track);
  const depthOf = (id: LucidShared.TPlayerId): number => depths[G.players[id].position] ?? 0;

  return G.order
    .filter(id => id !== playerId)
    .reduce((best, id) => (depthOf(id) > depthOf(best) ? id : best));
};

// Ход за отсутствующего игрока: кубик (у сейфа — попытка без доплаты), первый кубик на выбор, первая ветка на развилке, первый
// доступный по цене вариант события. Недоступный вариант брать нельзя —
// движок такой ход отклонит, и автопилот застрянет на нём навсегда
export const chooseAutoMove = (state: LucidShared.TState): LucidShared.TMove | null => {
  const playerId = state.ctx.currentPlayer;
  const stateId = state.stateId;

  if (state.ctx.phase === LucidShared.EPhase.ROLL) {
    if (state.G.players[playerId].position === state.G.track.finishId) {
      return { type: LucidShared.EMoveType.OPEN_SAFE, playerId, stateId, bonus: 0 };
    }

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

  if (state.ctx.phase === LucidShared.EPhase.LAW) {
    return { type: LucidShared.EMoveType.CHOOSE_LAW, playerId, stateId, index: 0 };
  }

  if (state.ctx.phase === LucidShared.EPhase.CARDS) {
    return { type: LucidShared.EMoveType.END_TURN, playerId, stateId };
  }

  if (state.ctx.phase === LucidShared.EPhase.SHOP) {
    return { type: LucidShared.EMoveType.BUY_CARD, playerId, stateId, index: null };
  }

  if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
    const player = state.G.players[playerId];
    const options = currentEvent(state.G, playerId)?.options ?? [];
    const optionIndex = options.findIndex(option => !option.cost || option.cost <= player.resource);

    if (optionIndex === -1) {
      return null;
    }

    const move = { type: LucidShared.EMoveType.CHOOSE_OPTION, playerId, stateId, optionIndex } as const;

    return LucidShared.optionNeedsTarget(options[optionIndex])
      ? { ...move, targetId: deepestOther(state.G, playerId) }
      : move;
  }

  return null;
};
