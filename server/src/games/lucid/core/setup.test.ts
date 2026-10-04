import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { setupParty } from '@/games/lucid/core/setup';
import { LAW_DECK } from '@/games/lucid/core/cards';

const content = (): LucidShared.TPartyContent => ({
  theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#001122'] },
  events: {},
});

describe('setupParty: законы', () => {
  it('колода законов перемешана и содержит все 15 законов, ячейки пусты', () => {
    const state = setupParty({
      seed: 'laws',
      players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
      content: { theme: { name: 'Т', resourceName: 'монеты', palette: ['#111111', '#222222', '#333333'] }, events: {} },
    });

    expect(state.G.cards.laws).toEqual([null, null, null]);
    expect([...state.G.cards.lawDeck].sort()).toEqual([...LAW_DECK].sort());
    expect(state.G.cards.lawDeck).toHaveLength(15);
    expect(state.G.turn.step).toBe(LucidShared.ETurnStep.START);
  });
});

describe('setupParty: названия карт', () => {
  it('cardNames контента попадает в G, cardName берёт имя модели или запасное', () => {
    const cardNames = { ROCKET: { name: 'Паровой рывок', flavor: 'Котёл гудит' } };
    const state = setupParty({
      seed: 'names',
      players: [{ id: 'a', nickname: 'Аня' }],
      content: { ...content(), cardNames },
    });

    expect(state.G.cardNames).toEqual(cardNames);
    expect(LucidShared.cardName(state.G, LucidShared.EShopCard.ROCKET)).toBe('Паровой рывок');
    expect(LucidShared.cardName({}, LucidShared.EShopCard.ROCKET)).toBe('Рывок');
    expect(LucidShared.cardName({}, LucidShared.ELaw.SIX_SKIP)).toBe('Шестёрка');
  });
});
