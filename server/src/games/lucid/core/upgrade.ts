import { LucidShared } from '@trgames/shared';

import { freshTurn } from '@/games/lucid/core/turn';
import { emptyCards } from '@/games/lucid/core/cards';

export const upgradeG = (G: LucidShared.TG, phase?: LucidShared.EPhase): LucidShared.TG => {
  const isChoiceWithoutTurn = !G.turn && phase === LucidShared.EPhase.CHOICE;

  return {
    ...G,
    cellHistory: G.cellHistory ?? {},
    cards: { ...emptyCards(), ...G.cards },
    turn: {
      ...freshTurn(),
      ...(isChoiceWithoutTurn ? { step: LucidShared.ETurnStep.LANDED } : {}),
      ...G.turn,
    },
  };
};
