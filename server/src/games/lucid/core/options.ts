import type { LucidShared } from '@trgames/shared';

import { rollDie } from '@/games/lucid/core/random';
import { applyEffect } from '@/games/lucid/core/effects';

// null означает «вариант недоступен»: ход должен быть отклонён целиком
export const resolveOption = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  option: LucidShared.TOption,
): LucidShared.TG | null => {
  const player = G.players[actorId];

  if (option.cost && player.resource < option.cost) {
    return null;
  }

  const paid = option.cost
    ? {
        ...G,
        players: {
          ...G.players,
          [actorId]: { ...player, resource: player.resource - option.cost },
        },
      }
    : G;

  if (!option.threshold) {
    return applyEffect(paid, actorId, option.success);
  }

  const roll = rollDie(paid.random);
  const withRoll: LucidShared.TG = {
    ...paid,
    random: roll.state,
    log: [
      ...paid.log,
      `${player.nickname} бросает кубик: ${roll.value} против порога ${option.threshold}`,
    ],
  };
  const effect = roll.value >= option.threshold ? option.success : option.failure;

  return effect ? applyEffect(withRoll, actorId, effect) : withRoll;
};
