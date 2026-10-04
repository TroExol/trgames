import { LucidShared } from '@trgames/shared';

import { proceed, withTurn } from '@/games/lucid/core/turn';
import { stepBy } from '@/games/lucid/core/cells';

const { EShopCard } = LucidShared;

const ROCKET_STEPS = 5;
const GRENADE_STEPS = 6;
const PUSH_STEPS = 4;

const moveTo = (G: LucidShared.TG, id: LucidShared.TPlayerId, position: number): LucidShared.TG => ({
  ...G,
  players: { ...G.players, [id]: { ...G.players[id], position } },
});

export const playCard = (
  state: LucidShared.TState,
  uid: number,
  targetId?: LucidShared.TPlayerId,
): LucidShared.TState | null => {
  const actorId = state.ctx.currentPlayer;
  const { G } = state;
  const item = (G.cards.hands[actorId] ?? []).find(card => card.uid === uid);

  const isFateWithoutTarget = item?.card === EShopCard.HAND_OF_FATE && !targetId;

  if (!item || !LucidShared.canPlay(G, actorId, item, targetId) || isFateWithoutTarget) {
    return null;
  }

  const actor = G.players[actorId];
  const ahead = LucidShared.nearestAhead(G, actorId);
  const victimId = item.card === EShopCard.HAND_OF_FATE ? targetId : ahead?.id;
  const victim = victimId === undefined ? undefined : G.players[victimId];
  const paid = withTurn(G, { used: [...G.turn.used, uid] });
  const charged: LucidShared.TG = {
    ...paid,
    players: {
      ...paid.players,
      [actorId]: { ...actor, resource: actor.resource - LucidShared.CARD_USE_PRICE },
    },
  };
  const name = LucidShared.cardName(G, item.card);
  const say = (what: string): string => `${actor.nickname} играет «${name}»: ${what}`;

  const walk = (id: LucidShared.TPlayerId, steps: number, what: string): LucidShared.TG =>
    stepBy({ ...charged, log: [...charged.log, say(what)] }, id, steps);

  switch (item.card) {
    case EShopCard.GRENADE:
      return proceed({
        ...state,
        G: walk(victim!.id, -GRENADE_STEPS, `${victim!.nickname} отступает на ${GRENADE_STEPS} клеток`),
      });
    case EShopCard.HAND_OF_FATE:
      return proceed({
        ...state,
        G: walk(victim!.id, -PUSH_STEPS, `${victim!.nickname} отступает на ${PUSH_STEPS} клетки`),
      });
    case EShopCard.HARPOON:
      return proceed({
        ...state,
        G: { ...moveTo(charged, victim!.id, actor.position), log: [...G.log, say(`${victim!.nickname} встаёт рядом`)] },
      });
    case EShopCard.HOOK:
      return proceed({
        ...state,
        G: {
          ...moveTo(charged, actorId, victim!.position),
          log: [...G.log, say(`подтягивается к игроку ${victim!.nickname}`)],
        },
      });
    case EShopCard.ROCKET:
      return proceed({
        ...state,
        G: walk(actorId, ROCKET_STEPS, `идёт на ${ROCKET_STEPS} клеток вперёд`),
      });
    default:
      return proceed({
        ...state,
        G: {
          ...charged,
          players: {
            ...charged.players,
            [victim!.id]: { ...charged.players[victim!.id], cursed: (victim!.cursed ?? 0) + 1 },
          },
          log: [...G.log, say(`${victim!.nickname} ждёт беду`)],
        },
      });
  }
};
