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

export const drawLaws = (G: LucidShared.TG, count: number): LucidShared.TG => {
  let { lawDeck, lawDiscard } = G.cards;
  let { random } = G;
  const lawDraw: LucidShared.ELaw[] = [];

  while (lawDraw.length < count) {
    if (lawDeck.length === 0) {
      if (lawDiscard.length === 0) {
        break;
      }

      const reshuffled = shuffle(random, lawDiscard);

      lawDeck = reshuffled.value;
      lawDiscard = [];
      random = reshuffled.state;
    }

    lawDraw.push(lawDeck[0]);
    lawDeck = lawDeck.slice(1);
  }

  return { ...G, random, cards: { ...G.cards, lawDeck, lawDiscard, lawDraw } };
};

export const placeLaw = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  index: number,
): LucidShared.TG | null => {
  const chosen = Number.isInteger(index) ? G.cards.lawDraw[index] : undefined;

  if (chosen === undefined) {
    return null;
  }

  const rest = G.cards.lawDraw.filter((_, drawIndex) => drawIndex !== index);
  const dropped = G.cards.laws[LAW_SLOTS - 1];
  const laws = [chosen, ...G.cards.laws.slice(0, LAW_SLOTS - 1)];
  const lines = [`${G.players[playerId].nickname} вводит закон «${LucidShared.LAW_TEXT[chosen].name}»`];

  if (dropped) {
    lines.push(`закон «${LucidShared.LAW_TEXT[dropped].name}» отменён`);
  }

  return {
    ...G,
    cards: {
      ...G.cards,
      laws,
      lawDraw: [],
      lawDiscard: [...G.cards.lawDiscard, ...rest, ...(dropped ? [dropped] : [])],
    },
    log: [...G.log, ...lines],
  };
};
