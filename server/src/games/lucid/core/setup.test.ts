import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { setupParty } from '@/games/lucid/core/setup';

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
