import type { LucidShared } from '@trgames/shared';

import { checkCondition } from '@/games/lucid/core/conditions';
import { applyAtom } from '@/games/lucid/core/atoms';

export const applyEffect = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  effect: LucidShared.TEffect,
): LucidShared.TG => {
  const passed = !effect.condition || checkCondition(G.players[actorId], effect.condition);
  const atoms = passed ? effect.atoms : effect.otherwise ?? [];

  return atoms.reduce((state, atom) => applyAtom(state, actorId, atom), G);
};
