import { LucidShared } from '@trgames/shared';

import { randomInt } from '@/games/lucid/core/random';

const isGain = (atom: LucidShared.TAtom): boolean => atom.kind === LucidShared.EAtomKind.SWAP_WITH_FIRST
  || (atom.target === LucidShared.ETarget.SELF && atom.value > 0
    && (atom.kind === LucidShared.EAtomKind.MOVE || atom.kind === LucidShared.EAtomKind.RESOURCE));

const hasGain = (effect?: LucidShared.TEffect): boolean =>
  Boolean(effect && [...effect.atoms, ...(effect.otherwise ?? [])].some(isGain));

export const isCalamity = (event: LucidShared.TEvent): boolean => event.options.length > 0
  && event.options.every(option => !hasGain(option.success) && !hasGain(option.failure));

export const drawEvent = (
  G: LucidShared.TG,
  kind: 'bad' | 'good',
): { G: LucidShared.TG; cellId?: number } => {
  const pool = Object.values(G.events).filter(event => isCalamity(event) === (kind === 'bad'));

  if (pool.length === 0) {
    return { G };
  }

  const picked = randomInt(G.random, 0, pool.length - 1);
  const { cellId } = pool[picked.value];

  return {
    G: {
      ...G,
      random: picked.state,
      visited: G.visited.includes(cellId) ? G.visited : [...G.visited, cellId],
    },
    cellId,
  };
};
