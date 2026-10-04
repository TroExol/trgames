import { LucidShared } from '@trgames/shared';

const LANDED_PREFIX = /^Остановился на (зелёной|красной|пустой)(:| —) /;

type TCellHintG = Pick<LucidShared.TStateForPlayer['G'], 'cardNames' | 'cards' | 'theme'>;

const COLOR_PREFIX: Partial<Record<LucidShared.ECellType, { law: string; title: string }>> = {
  [LucidShared.ECellType.GREEN]: { law: 'GREEN_', title: 'Зелёная' },
  [LucidShared.ECellType.RED]: { law: 'RED_', title: 'Красная' },
};

const passiveRules = (cell: LucidShared.TCell, G: TCellHintG, you: LucidShared.TPlayerId): string[] => {
  const cards = new Set((G.cards.hands[you] ?? []).map(item => item.card));

  return Object.values(LucidShared.EShopCard)
    .filter(card => cards.has(card) && LucidShared.SHOP_TEXT[card].landsOn === cell.type)
    .map(card => {
      const rule = LucidShared.SHOP_TEXT[card].rule(G.theme.resourceName).replace(LANDED_PREFIX, '');

      return `твоя «${LucidShared.cardName(G, card)}» — ${rule}`;
    });
};

export const cellHint = (cell: LucidShared.TCell, G: TCellHintG, you: LucidShared.TPlayerId): string => {
  const color = COLOR_PREFIX[cell.type];
  const passives = passiveRules(cell, G, you);

  if (color) {
    const rules = G.cards.laws
      .filter((law): law is LucidShared.ELaw => law !== null && law.startsWith(color.law))
      .map(law => {
        const rule = LucidShared.LAW_TEXT[law].rule(G.theme.resourceName).replace(LANDED_PREFIX, '');

        return `«${LucidShared.cardName(G, law)}» — ${rule}`;
      });

    const parts = [...rules, ...passives];

    return `${color.title}: ${parts.length > 0 ? parts.join('; ') : 'сейчас ничего не даёт'}`;
  }

  switch (cell.type) {
    case LucidShared.ECellType.EVENT:
      return 'Событие: откроется, когда кто-то остановится здесь';
    case LucidShared.ECellType.FINISH:
      return `Финиш: сейф открывается броском ${LucidShared.SAFE_THRESHOLD}+`;
    case LucidShared.ECellType.LAW:
      return 'Закон: тянешь два закона, один вводишь на стол';
    case LucidShared.ECellType.PORTAL:
      return `Портал: переносит на парную клетку, пара ${(cell.portal?.pair ?? 0) + 1}`;
    case LucidShared.ECellType.SHOP:
      return `Лавка: три карты на выбор, одна за ${LucidShared.SHOP_PRICE}`;
    case LucidShared.ECellType.START:
      return 'Старт';
    default:
      return `Пустая: ${passives.length > 0 ? passives.join('; ') : 'ничего'}`;
  }
};
