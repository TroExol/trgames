import { LucidShared } from '@trgames/shared';

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

const walkWith = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  lastRoll: LucidShared.TRoll,
  line: string,
): LucidShared.TG => {
  const moved = applyWalk(
    { ...G, lastRoll },
    playerId,
    walkForward(G.track, G.players[playerId].position, lastRoll.value),
  );

  return { ...moved, log: [...moved.log, line] };
};

export const rollAndMove = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
): LucidShared.TG => {
  const player = G.players[playerId];
  const depths = LucidShared.trackDepths(G.track);
  const zone = LucidShared.diceZoneForDepth(depths[player.position] ?? 0, depths[G.track.finishId] ?? 0);
  const first = rollDie(G.random);

  if (zone === LucidShared.EDiceZone.ONE) {
    return walkWith(
      { ...G, random: first.state },
      playerId,
      { playerId, value: first.value },
      `${player.nickname} выбрасывает ${first.value}`,
    );
  }

  const second = rollDie(first.state);
  const values = [first.value, second.value];

  if (zone === LucidShared.EDiceZone.PICK) {
    return {
      ...G,
      random: second.state,
      lastRoll: { playerId, value: first.value, values, pending: true },
      log: [...G.log, `${player.nickname} выбрасывает ${first.value} и ${second.value}`],
    };
  }

  const sum = first.value + second.value;

  return walkWith(
    { ...G, random: second.state },
    playerId,
    { playerId, value: sum, values },
    `${player.nickname} выбрасывает ${first.value} + ${second.value} = ${sum}`,
  );
};

// null — выбирать нечего: бросок не ждёт выбора или такого кубика нет
export const pickDie = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  dieIndex: number,
): LucidShared.TG | null => {
  const roll = G.lastRoll;
  const value = roll?.pending ? roll.values?.[dieIndex] : undefined;

  if (!roll || value === undefined) {
    return null;
  }

  return walkWith(
    G,
    playerId,
    { playerId, value, values: roll.values, picked: dieIndex },
    `${G.players[playerId].nickname} идёт на ${value}`,
  );
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
