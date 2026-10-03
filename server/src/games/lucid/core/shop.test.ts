import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { buyCard, openShop } from '@/games/lucid/core/cards';

const { EShopCard } = LucidShared;
const card = (uid: number, kind: LucidShared.EShopCard): LucidShared.THandCard => ({ uid, card: kind });

const withShop = (resource: number, hand: LucidShared.THandCard[] = []): LucidShared.TG => {
  const G = makeG({
    players: [
      { id: 'a', nickname: 'Аня', position: 0, resource },
      { id: 'b', nickname: 'Боря', position: 0, resource: 0 },
    ],
  });

  return {
    ...G,
    cards: {
      ...G.cards,
      shopDeck: [
        card(1, EShopCard.ROCKET),
        card(2, EShopCard.CLOVER),
        card(3, EShopCard.VOODOO),
        card(4, EShopCard.HOOK),
      ],
      hands: { a: hand, b: [] },
    },
  };
};

describe('Лавка', () => {
  it('открывает три карты', () => {
    expect(openShop(withShop(10)).cards.shopOffer.map(item => item.uid)).toEqual([1, 2, 3]);
  });

  it('покупка: карта в руку, цена списана, остальные в сброс', () => {
    const bought = buyCard(openShop(withShop(10)), 'a', 1)!;

    expect(bought.cards.hands.a).toEqual([card(2, EShopCard.CLOVER)]);
    expect(bought.players.a.resource).toBe(5);
    expect(bought.cards.shopDiscard.map(item => item.uid)).toEqual([1, 3]);
    expect(bought.cards.shopOffer).toEqual([]);
  });

  it('отказ: всё в сброс, Ресурс цел', () => {
    const skipped = buyCard(openShop(withShop(10)), 'a', null)!;

    expect(skipped.players.a.resource).toBe(10);
    expect(skipped.cards.shopDiscard).toHaveLength(3);
  });

  it('полная рука: без карты на сброс покупка отклоняется', () => {
    const full = [card(7, EShopCard.ROCKET), card(8, EShopCard.ROCKET), card(9, EShopCard.ROCKET)];
    const shop = openShop(withShop(10, full));

    expect(buyCard(shop, 'a', 0)).toBeNull();
    expect(buyCard(shop, 'a', 0, 8)!.cards.hands.a.map(item => item.uid)).toEqual([7, 9, 1]);
  });

  it('не хватает Ресурса — покупка отклоняется', () => {
    expect(buyCard(openShop(withShop(4)), 'a', 0)).toBeNull();
  });
});
