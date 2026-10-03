import { LucidShared } from '@trgames/shared';

import { nearestAhead } from '@/games/lucid/core/targets';

const { EShopCard } = LucidShared;
const REACH = 10;

const atFinish = (G: LucidShared.TG, id: LucidShared.TPlayerId): boolean =>
  G.players[id].position === G.track.finishId;

export const isValidTarget = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  targetId?: LucidShared.TPlayerId,
): boolean =>
  targetId !== undefined && targetId !== actorId && Boolean(G.players[targetId]) && !atFinish(G, targetId);

export const canPlay = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  item: LucidShared.THandCard,
  targetId?: LucidShared.TPlayerId,
): boolean => {
  const text = LucidShared.SHOP_TEXT[item.card];

  if (text.kind === 'passive' || G.turn.used.includes(item.uid)) {
    return false;
  }

  if (G.players[actorId].resource < LucidShared.CARD_USE_PRICE) {
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

export const hasPlayable = (G: LucidShared.TG, actorId: LucidShared.TPlayerId): boolean =>
  (G.cards.hands[actorId] ?? []).some(item => canPlay(G, actorId, item));
