import { LucidShared } from '@trgames/shared';

import { shuffle } from '@/games/lucid/core/random';

export const LAW_SLOTS = 3;

export const LAW_DECK: LucidShared.ELaw[] = Object.values(LucidShared.ELaw)
  .filter(law => law !== LucidShared.ELaw.LAST_START_FREE_CARD);

export const emptyCards = (): LucidShared.TCards => ({
  laws: Array.from({ length: LAW_SLOTS }, () => null),
  lawDeck: [],
  lawDiscard: [],
  lawDraw: [],
});

export const createCards = (random: LucidShared.TRandomState): LucidShared.TCards => ({
  ...emptyCards(),
  lawDeck: shuffle(random, LAW_DECK).value,
});
