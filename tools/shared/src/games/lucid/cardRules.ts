import type { TG, TPlayerId } from './types/state';
import type {
  TCards,
  THandCard,
  TTurn,
} from './types/cards';

import { EShopCard } from './types/cards';
import { trackDepths } from './track';
import { CARD_USE_PRICE, SHOP_TEXT } from './cardText';

export type TCardRulesG = { cards: Pick<TCards, 'hands'>; turn: Pick<TTurn, 'used'> }
  & Pick<TG, 'order' | 'players' | 'track'>;

const REACH = 10;

const atFinish = (G: TCardRulesG, id: TPlayerId): boolean => G.players[id].position === G.track.finishId;

const isValidTarget = (G: TCardRulesG, actorId: TPlayerId, targetId?: TPlayerId): boolean =>
  targetId !== undefined && targetId !== actorId && G.order.includes(targetId) && !atFinish(G, targetId);

export const nearestAhead = (
  G: TCardRulesG,
  actorId: TPlayerId,
): { id: TPlayerId; distance: number } | undefined => {
  const depths = trackDepths(G.track);
  const own = depths[G.players[actorId].position] ?? 0;
  const ahead = G.order
    .filter(id => id !== actorId && G.players[id].position !== G.track.finishId)
    .map(id => ({ id, distance: (depths[G.players[id].position] ?? 0) - own }))
    .filter(item => item.distance > 0);

  return ahead.reduce<{ id: TPlayerId; distance: number } | undefined>(
    (best, item) => (!best || item.distance < best.distance ? item : best),
    undefined,
  );
};

export const canPlay = (
  G: TCardRulesG,
  actorId: TPlayerId,
  item: THandCard,
  targetId?: TPlayerId,
): boolean => {
  const text = SHOP_TEXT[item.card];

  if (text.kind === 'passive' || G.turn.used.includes(item.uid)) {
    return false;
  }

  if (G.players[actorId].resource < CARD_USE_PRICE) {
    return false;
  }

  if (item.card === EShopCard.HAND_OF_FATE) {
    return targetId === undefined
      ? G.order.some(id => isValidTarget(G, actorId, id))
      : isValidTarget(G, actorId, targetId);
  }

  const ahead = nearestAhead(G, actorId);

  switch (item.card) {
    case EShopCard.HARPOON:
      return Boolean(ahead && ahead.distance <= REACH);
    case EShopCard.HOOK:
      return !atFinish(G, actorId) && Boolean(ahead && ahead.distance <= REACH);
    case EShopCard.ROCKET:
      return !atFinish(G, actorId);
    default:
      return Boolean(ahead);
  }
};

export const hasPlayable = (G: TCardRulesG, actorId: TPlayerId): boolean =>
  (G.cards.hands[actorId] ?? []).some(item => canPlay(G, actorId, item));
