import type { LucidShared } from '@trgames/shared';

import { rollDie } from '@/games/lucid/core/random';
import { applyEffect } from '@/games/lucid/core/effects';

// null означает «вариант недоступен»: ход должен быть отклонён целиком
export const resolveOption = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  optionIndex: number,
  option: LucidShared.TOption,
  cellId?: number,
  chosenId?: LucidShared.TPlayerId,
): LucidShared.TG | null => {
  const player = G.players[actorId];

  if (option.cost && player.resource < option.cost) {
    return null;
  }

  const logStart = G.log.length;

  // Что выбрано — первая строка ленты по этому ходу, раньше броска и эффекта
  const chosen: LucidShared.TG = { ...G, log: [...G.log, `${player.nickname} выбирает «${option.text}»`] };

  const paid = option.cost
    ? {
        ...chosen,
        players: {
          ...chosen.players,
          [actorId]: { ...player, resource: player.resource - option.cost },
        },
      }
    : chosen;

  let branch: LucidShared.TBranch = 'success';
  let roll: number | undefined;
  let afterRoll = paid;
  let effect: LucidShared.TEffect | undefined = option.success;

  if (option.threshold) {
    const rolled = rollDie(paid.random);

    roll = rolled.value;
    branch = rolled.value >= option.threshold ? 'success' : 'failure';
    afterRoll = {
      ...paid,
      random: rolled.state,
      lastRoll: { playerId: actorId, value: rolled.value, threshold: option.threshold },
      log: [
        ...paid.log,
        `${player.nickname} бросает кубик: ${rolled.value} против порога ${option.threshold}`,
      ],
    };
    effect = branch === 'success' ? option.success : option.failure;
  }

  const resolved = effect
    ? applyEffect(afterRoll, actorId, effect, chosenId)
    : { ...afterRoll, log: [...afterRoll.log, 'ничего не произошло'] };

  const entry: LucidShared.THistoryEntry = {
    playerId: actorId,
    nickname: player.nickname,
    optionIndex,
    branch,
    roll,
    ...(chosenId && { targetNickname: G.players[chosenId].nickname }),
    lines: resolved.log.slice(logStart),
  };

  if (cellId === undefined) {
    return resolved;
  }

  return {
    ...resolved,
    cellHistory: { ...resolved.cellHistory, [cellId]: [...(resolved.cellHistory[cellId] ?? []), entry] },
  };
};
