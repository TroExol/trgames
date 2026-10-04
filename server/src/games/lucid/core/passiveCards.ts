import { LucidShared } from '@trgames/shared';

import type { TLawRun } from '@/games/lucid/core/lawEffects';

import { addResource, log } from '@/games/lucid/core/lawEffects';
import { stepBy } from '@/games/lucid/core/cells';

const { ECellType, EShopCard } = LucidShared;

export const rollBonus = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): number =>
  (G.cards.hands[playerId] ?? []).filter(item => item.card === EShopCard.MAGIC_DIE).length;

const cellTypeOf = (G: LucidShared.TG): LucidShared.ECellType | undefined =>
  G.track.cells.find(cell => cell.id === G.turn.landedCellId)?.type;

const passiveLine = (card: LucidShared.EShopCard, G: LucidShared.TG, playerId: LucidShared.TPlayerId, what: string) =>
  `карта «${LucidShared.SHOP_TEXT[card].name}»: ${G.players[playerId].nickname} — ${what}`;

export const runPassives = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): TLawRun => {
  let current = G;
  let traveled = false;

  for (const item of G.cards.hands[playerId] ?? []) {
    const type = cellTypeOf(current);
    const player = current.players[playerId];

    if (current.turn.used.includes(item.uid) || LucidShared.SHOP_TEXT[item.card].kind !== 'passive') {
      continue;
    }

    const marked = { ...current, turn: { ...current.turn, used: [...current.turn.used, item.uid] } };
    const resourceName = current.theme.resourceName;

    if (item.card === EShopCard.MONEY_MAGNET && type === ECellType.RED) {
      current = log(addResource(marked, playerId, 5), passiveLine(item.card, current, playerId, `${resourceName} +5`));
    } else if (item.card === EShopCard.CLOVER && type === ECellType.EMPTY) {
      current = log(addResource(marked, playerId, 4), passiveLine(item.card, current, playerId, `${resourceName} +4`));
    } else if (
      item.card === EShopCard.TRAVELATOR
      && type === ECellType.EMPTY
      && !traveled
      && player.position !== G.track.finishId
    ) {
      traveled = true;
      current = stepBy(log(marked, passiveLine(item.card, current, playerId, '+4 клетки')), playerId, 4);
    }
  }

  return { G: current };
};
