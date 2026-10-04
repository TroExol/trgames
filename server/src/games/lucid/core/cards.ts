import { LucidShared } from '@trgames/shared';

import { shuffle } from '@/games/lucid/core/random';

export const LAW_SLOTS = 3;

const SHOP_COPIES = 2;

export const LAW_DECK: LucidShared.ELaw[] = Object.values(LucidShared.ELaw);

const SHOP_DECK: LucidShared.THandCard[] = Object.values(LucidShared.EShopCard)
  .flatMap(card => Array.from({ length: SHOP_COPIES }, () => card))
  .map((card, uid) => ({ uid, card }));

export const emptyCards = (): LucidShared.TCards => ({
  laws: Array.from({ length: LAW_SLOTS }, () => null),
  lawDeck: [],
  lawDiscard: [],
  lawDraw: [],
  shopDeck: [],
  shopDiscard: [],
  shopOffer: [],
  hands: {},
});

export const createCards = (random: LucidShared.TRandomState): LucidShared.TCards => {
  const laws = shuffle(random, LAW_DECK);

  return { ...emptyCards(), lawDeck: laws.value, shopDeck: shuffle(laws.state, SHOP_DECK).value };
};

const drawFrom = <T>(
  deck: T[],
  discard: T[],
  random: LucidShared.TRandomState,
  count: number,
): { drawn: T[]; deck: T[]; discard: T[]; random: LucidShared.TRandomState } => {
  let rest = deck;
  let pile = discard;
  let state = random;
  const drawn: T[] = [];

  while (drawn.length < count) {
    if (rest.length === 0) {
      if (pile.length === 0) {
        break;
      }

      const reshuffled = shuffle(state, pile);

      rest = reshuffled.value;
      pile = [];
      state = reshuffled.state;
    }

    drawn.push(rest[0]);
    rest = rest.slice(1);
  }

  return { drawn, deck: rest, discard: pile, random: state };
};

export const drawLaws = (G: LucidShared.TG, count: number): LucidShared.TG => {
  const result = drawFrom(G.cards.lawDeck, G.cards.lawDiscard, G.random, count);

  return {
    ...G,
    random: result.random,
    cards: { ...G.cards, lawDeck: result.deck, lawDiscard: result.discard, lawDraw: result.drawn },
  };
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
  const lines = [`${G.players[playerId].nickname} вводит закон «${LucidShared.cardName(G, chosen)}»`];

  if (dropped) {
    lines.push(`закон «${LucidShared.cardName(G, dropped)}» отменён`);
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

export const openShop = (G: LucidShared.TG): LucidShared.TG => {
  const drawn = drawFrom(G.cards.shopDeck, G.cards.shopDiscard, G.random, LucidShared.SHOP_OFFER);

  return {
    ...G,
    random: drawn.random,
    cards: { ...G.cards, shopDeck: drawn.deck, shopDiscard: drawn.discard, shopOffer: drawn.drawn },
  };
};

export const buyCard = (
  G: LucidShared.TG,
  playerId: LucidShared.TPlayerId,
  index: number | null,
  discardUid?: number,
): LucidShared.TG | null => {
  const player = G.players[playerId];
  const hand = G.cards.hands[playerId] ?? [];
  const offer = G.cards.shopOffer;

  if (index === null) {
    return {
      ...G,
      cards: { ...G.cards, shopOffer: [], shopDiscard: [...G.cards.shopDiscard, ...offer] },
      log: [...G.log, `${player.nickname} ничего не берёт в Лавке`],
    };
  }

  const bought = Number.isInteger(index) ? offer[index] : undefined;
  const dropped = hand.find(item => item.uid === discardUid);

  if (!bought || player.resource < LucidShared.SHOP_PRICE || (hand.length >= LucidShared.HAND_LIMIT && !dropped)) {
    return null;
  }

  const kept = dropped ? hand.filter(item => item !== dropped) : hand;
  const lines = [`${player.nickname} покупает «${LucidShared.cardName(G, bought.card)}»`];

  if (dropped) {
    lines.push(`${player.nickname} сбрасывает «${LucidShared.cardName(G, dropped.card)}»`);
  }

  return {
    ...G,
    players: { ...G.players, [playerId]: { ...player, resource: player.resource - LucidShared.SHOP_PRICE } },
    cards: {
      ...G.cards,
      hands: { ...G.cards.hands, [playerId]: [...kept, bought] },
      shopOffer: [],
      shopDiscard: [...G.cards.shopDiscard, ...offer.filter(item => item !== bought), ...(dropped ? [dropped] : [])],
    },
    log: [...G.log, ...lines],
  };
};

export const giveCard = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TG => {
  const hand = G.cards.hands[playerId] ?? [];

  if (hand.length >= LucidShared.HAND_LIMIT) {
    return G;
  }

  const drawn = drawFrom(G.cards.shopDeck, G.cards.shopDiscard, G.random, 1);

  if (drawn.drawn.length === 0) {
    return G;
  }

  return {
    ...G,
    random: drawn.random,
    cards: {
      ...G.cards,
      shopDeck: drawn.deck,
      shopDiscard: drawn.discard,
      hands: { ...G.cards.hands, [playerId]: [...hand, ...drawn.drawn] },
    },
  };
};
