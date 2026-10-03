import type { LucidShared } from '@trgames/shared';

import { freshTurn } from '@/games/lucid/core/turn';
import { emptyCards } from '@/games/lucid/core/cards';

export const upgradeG = (G: LucidShared.TG): LucidShared.TG => ({
  ...G,
  cellHistory: G.cellHistory ?? {},
  cards: { ...emptyCards(), ...G.cards },
  turn: G.turn ?? freshTurn(),
});
