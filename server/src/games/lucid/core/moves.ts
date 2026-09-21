import type { LucidShared } from '@trgames/shared';

import type { TWalkResult } from '@/games/lucid/core/movement';

import { rollDie } from '@/games/lucid/core/random';
import { walkForward } from '@/games/lucid/core/movement';

const applyWalk = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  result: TWalkResult,
): LucidShared.TG => ({
  ...G,
  players: {
    ...G.players,
    [playerId]: { ...G.players[playerId], position: result.position },
  },
  pendingSteps: result.stepsLeft,
  branchChoices: result.branchChoices,
  visited: G.visited.includes(result.position) ? G.visited : [...G.visited, result.position],
});

export const rollAndMove = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
): LucidShared.TG => {
  const roll = rollDie(G.random);
  const player = G.players[playerId];
  const moved = applyWalk(
    { ...G, random: roll.state },
    playerId,
    walkForward(G.track, player.position, roll.value),
  );

  return { ...moved, log: [...moved.log, `${player.nickname} выбросил ${roll.value}`] };
};

// Шаг на выбранную ветку тратит один шаг, остаток дохаживается.
// По дороге может встретиться ещё одна развилка — тогда спросим снова
export const takeBranch = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  cellId: number,
): LucidShared.TG => {
  const stepsLeft = Math.max(G.pendingSteps - 1, 0);
  const stepped = applyWalk(G, playerId, { position: cellId, stepsLeft, branchChoices: [] });

  return applyWalk(stepped, playerId, walkForward(G.track, cellId, stepsLeft));
};
