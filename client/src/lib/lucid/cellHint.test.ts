import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { cellHint } from './cellHint';

const ECellType = LucidShared.ECellType;
const ELaw = LucidShared.ELaw;

const EShopCard = LucidShared.EShopCard;

const makeG = (laws: (LucidShared.ELaw | null)[], hands: Record<string, LucidShared.THandCard[]> = {}) => ({
  cardNames: undefined,
  cards: { hands, lawDraw: [], laws, shopOffer: [] },
  theme: { resourceName: 'заряды' },
}) as unknown as Parameters<typeof cellHint>[1];

const cellOf = (type: LucidShared.ECellType, portal?: LucidShared.TPortal): LucidShared.TCell =>
  ({ id: 1, next: [], portal, type });

describe('cellHint', () => {
  const G = makeG([ELaw.GREEN_RESOURCE, ELaw.RED_BAD, null]);
  const hand = (...cards: LucidShared.EShopCard[]) => ({ me: cards.map((card, i) => ({ card, uid: i })) });

  it('события, закона, пустой, старта', () => {
    expect(cellHint(cellOf(ECellType.EVENT), G, 'me')).toBe('Событие: откроется, когда кто-то остановится здесь');
    expect(cellHint(cellOf(ECellType.LAW), G, 'me')).toBe('Закон: тянешь два закона, один вводишь на стол');
    expect(cellHint(cellOf(ECellType.EMPTY), G, 'me')).toBe('Пустая: ничего');
    expect(cellHint(cellOf(ECellType.START), G, 'me')).toBe('Старт');
  });

  it('лавка берёт цену и название ресурса', () => {
    expect(cellHint(cellOf(ECellType.SHOP), G, 'me')).toBe(
      `Лавка: три карты на выбор, одна за ${LucidShared.SHOP_PRICE}`,
    );
  });

  it('портал показывает номер пары как на поле', () => {
    expect(cellHint(cellOf(ECellType.PORTAL, { pair: 1, to: 5 }), G, 'me')).toBe(
      'Портал: переносит на парную клетку, пара 2',
    );
  });

  it('финиш берёт порог сейфа', () => {
    expect(cellHint(cellOf(ECellType.FINISH), G, 'me')).toBe(
      `Финиш: сейф открывается броском ${LucidShared.SAFE_THRESHOLD}+`,
    );
  });

  it('зелёная и красная перечисляют законы своего цвета', () => {
    expect(cellHint(cellOf(ECellType.GREEN), G, 'me')).toBe(
      'Зелёная: «Урожай» — заряды +5',
    );
    expect(cellHint(cellOf(ECellType.RED), G, 'me')).toBe(
      'Красная: «Дурная примета» — разыграй случайную беду',
    );
  });

  it('без законов цвета — ничего не даёт', () => {
    expect(cellHint(cellOf(ECellType.GREEN), makeG([ELaw.RED_BAD]), 'me')).toBe('Зелёная: сейчас ничего не даёт');
    expect(cellHint(cellOf(ECellType.RED), makeG([null, null, null]), 'me')).toBe('Красная: сейчас ничего не даёт');
  });

  it('карта руки на красной', () => {
    expect(cellHint(cellOf(ECellType.RED), makeG([null, null, null], hand(EShopCard.MONEY_MAGNET)), 'me')).toBe(
      'Красная: твоя «Громоотвод» — заряды +5',
    );
  });

  it('карта руки на пустой', () => {
    expect(cellHint(cellOf(ECellType.EMPTY), makeG([], hand(EShopCard.CLOVER)), 'me')).toBe(
      'Пустая: твоя «Подкова» — заряды +4',
    );
  });

  it('закон и карта', () => {
    expect(cellHint(cellOf(ECellType.RED), makeG([null, ELaw.RED_BAD, null], hand(EShopCard.MONEY_MAGNET)), 'me')).toBe(
      'Красная: «Дурная примета» — разыграй случайную беду; твоя «Громоотвод» — заряды +5',
    );
  });

  it('две копии — одна строка', () => {
    expect(
      cellHint(cellOf(ECellType.RED), makeG([], hand(EShopCard.MONEY_MAGNET, EShopCard.MONEY_MAGNET)), 'me'),
    ).toBe('Красная: твоя «Громоотвод» — заряды +5');
  });

  it('чужая рука и карты других клеток не попадают', () => {
    const crowded = makeG([], {
      ...hand(EShopCard.MAGIC_DIE, EShopCard.CLOVER),
      other: [{ card: EShopCard.MONEY_MAGNET, uid: 9 }],
    });

    expect(cellHint(cellOf(ECellType.RED), crowded, 'me')).toBe('Красная: сейчас ничего не даёт');
    expect(cellHint(cellOf(ECellType.GREEN), crowded, 'me')).toBe('Зелёная: сейчас ничего не даёт');
  });
});
