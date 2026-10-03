import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { drawLaws, placeLaw } from '@/games/lucid/core/cards';

const { ELaw } = LucidShared;

describe('колода законов', () => {
  it('тянет из колоды, пустая колода собирается из сброса', () => {
    const G = makeG();
    const drawn = drawLaws({
      ...G,
      cards: { ...G.cards, lawDeck: [ELaw.SIX_SKIP], lawDiscard: [ELaw.RED_BAD, ELaw.GREEN_AGAIN] },
    }, 2);

    expect(drawn.cards.lawDraw).toHaveLength(2);
    expect(drawn.cards.lawDraw[0]).toBe(ELaw.SIX_SKIP);
    expect(drawn.cards.lawDeck).toHaveLength(1);
    expect(drawn.cards.lawDiscard).toEqual([]);
  });

  it('новый закон встаёт слева, правый уходит в сброс, невыбранный тоже', () => {
    const G = makeG();
    const placed = placeLaw({
      ...G,
      cards: {
        ...G.cards,
        laws: [ELaw.RED_BAD, ELaw.GREEN_AGAIN, ELaw.SIX_SKIP],
        lawDraw: [ELaw.GREEN_RESOURCE, ELaw.RED_PAY_ALL],
      },
    }, 'a', 1)!;

    expect(placed.cards.laws).toEqual([ELaw.RED_PAY_ALL, ELaw.RED_BAD, ELaw.GREEN_AGAIN]);
    expect(placed.cards.lawDiscard).toEqual([ELaw.GREEN_RESOURCE, ELaw.SIX_SKIP]);
    expect(placed.cards.lawDraw).toEqual([]);
    expect(placed.log.at(-2)).toBe('Аня вводит закон «Налог»');
    expect(placed.log.at(-1)).toBe('закон «Шестёрка» отменён');
  });

  it('индекс вне вытянутых — null', () => {
    const G = makeG();

    expect(placeLaw({ ...G, cards: { ...G.cards, lawDraw: [ELaw.RED_BAD] } }, 'a', 1)).toBeNull();
    expect(placeLaw({ ...G, cards: { ...G.cards, lawDraw: [ELaw.RED_BAD] } }, 'a', 0.5)).toBeNull();
  });
});
