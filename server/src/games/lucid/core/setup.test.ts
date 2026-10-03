import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { setupParty } from '@/games/lucid/core/setup';
import { LAW_DECK } from '@/games/lucid/core/cards';

const content = (roles?: LucidShared.TRole[]): LucidShared.TPartyContent => ({
  theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#001122'] },
  events: {},
  roles,
});

describe('setupParty: роли игроков', () => {
  it('сопоставляет роль игроку по нику', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
      content: content([{ nickname: 'Аня', role: 'хранитель компаса' }]),
    });

    expect(state.G.players.a.role).toBe('хранитель компаса');
  });

  it('несовпавший ник не мешает остальным: мир не перегенерируется из-за него', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
      content: content([
        { nickname: 'Чужой ник', role: 'призрак из другой партии' },
        { nickname: 'Боря', role: 'капитан корабля' },
      ]),
    });

    expect(state.G.players.a.role).toBeUndefined();
    expect(state.G.players.b.role).toBe('капитан корабля');
  });

  it('игрок без роли в ответе модели остаётся без роли', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
      content: content([{ nickname: 'Аня', role: 'хранитель компаса' }]),
    });

    expect(state.G.players.b.role).toBeUndefined();
  });

  it('роли не пришли вовсе: все игроки без ролей, без падения', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }],
      content: content(undefined),
    });

    expect(state.G.players.a.role).toBeUndefined();
  });

  it('повтор ника в ответе модели: побеждает последняя запись', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }],
      content: content([
        { nickname: 'Аня', role: 'первая роль' },
        { nickname: 'Аня', role: 'вторая роль' },
      ]),
    });

    expect(state.G.players.a.role).toBe('вторая роль');
  });
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
