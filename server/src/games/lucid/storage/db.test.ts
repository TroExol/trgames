import {
  describe,
  expect,
  it,
} from 'vitest';

import { createStorage } from '@/games/lucid/storage/db';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { setupParty } from '@/games/lucid/core/setup';

const makeState = () => setupParty({
  seed: 'storage',
  players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
  content: loadFallbackContent(),
});

describe('storage', () => {
  it('сохранённая партия читается обратно без потерь', () => {
    const storage = createStorage(':memory:');
    const state = makeState();

    storage.saveParty({ uuid: 'p1', theme: 'станция', state });

    expect(storage.loadParty('p1')).toEqual(state);
  });

  it('повторное сохранение перезаписывает партию', () => {
    const storage = createStorage(':memory:');
    const state = makeState();

    storage.saveParty({ uuid: 'p1', theme: 'станция', state });
    state.G.players.a.position = 7;
    storage.saveParty({ uuid: 'p1', theme: 'станция', state });

    expect(storage.loadParty('p1')!.G.players.a.position).toBe(7);
  });

  it('несуществующая партия читается как null', () => {
    expect(createStorage(':memory:').loadParty('нет-такой')).toBeNull();
  });

  it('расход токенов накапливается по партии', () => {
    const storage = createStorage(':memory:');

    storage.saveUsage({ partyUuid: 'p1', inputTokens: 100, outputTokens: 200, usedFallback: false });
    storage.saveUsage({ partyUuid: 'p1', inputTokens: 50, outputTokens: 60, usedFallback: true });

    expect(storage.totalUsage('p1')).toEqual({ inputTokens: 150, outputTokens: 260 });
  });

  it('расход по чужой партии не смешивается', () => {
    const storage = createStorage(':memory:');

    storage.saveUsage({ partyUuid: 'p1', inputTokens: 100, outputTokens: 200, usedFallback: false });

    expect(storage.totalUsage('p2')).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it('удаление партии убирает её из базы', () => {
    const storage = createStorage(':memory:');

    storage.saveParty({ uuid: 'p1', theme: 'станция', state: makeState() });
    storage.removeParty('p1');

    expect(storage.loadParty('p1')).toBeNull();
  });
});
