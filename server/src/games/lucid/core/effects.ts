import type { LucidShared } from '@trgames/shared';

import { checkCondition } from '@/games/lucid/core/conditions';
import { applyAtom } from '@/games/lucid/core/atoms';
import { describeAtomLog } from '@/games/lucid/core/atomLog';

export const applyEffect = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  effect: LucidShared.TEffect,
): LucidShared.TG => {
  const passed = !effect.condition || checkCondition(G.players[actorId], effect.condition);
  const atoms = passed ? effect.atoms : effect.otherwise ?? [];

  // Условие не прошло, запасной ветки нет — эффект пуст, это тоже стоит
  // отметить в ленте, а не промолчать
  if (atoms.length === 0) {
    return { ...G, log: [...G.log, 'ничего не произошло'] };
  }

  return atoms.reduce((state, atom) => {
    const line = describeAtomLog(state, actorId, atom);
    const applied = applyAtom(state, actorId, atom);

    return { ...applied, log: [...applied.log, line] };
  }, G);
};
