import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { createStorage } from '@/games/lucid/storage/db';

const makeState = () => makeFallbackParty({ seed: 'storage', playerCount: 2 });

describe('storage', () => {
  it('сохранённая партия читается обратно без потерь', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');
    const state = makeState();

    storage.saveParty({ uuid: 'p1', theme: 'станция', document: state });

    expect(storage.loadParty('p1')).toEqual(state);
  });

  it('повторное сохранение перезаписывает партию', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');
    const state = makeState();

    storage.saveParty({ uuid: 'p1', theme: 'станция', document: state });
    state.G.players.p0.position = 7;
    storage.saveParty({ uuid: 'p1', theme: 'станция', document: state });

    expect(storage.loadParty('p1')!.G.players.p0.position).toBe(7);
  });

  it('несуществующая партия читается как null', () => {
    expect(createStorage<LucidShared.TState>(':memory:').loadParty('нет-такой')).toBeNull();
  });

  it('расход токенов и стоимости накапливается по партии', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveUsage({ partyUuid: 'p1', inputTokens: 100, outputTokens: 200, costUsd: 0.01, usedFallback: false });
    storage.saveUsage({ partyUuid: 'p1', inputTokens: 50, outputTokens: 60, costUsd: 0.005, usedFallback: true });

    expect(storage.totalUsage('p1')).toEqual({ inputTokens: 150, outputTokens: 260, costUsd: 0.015 });
  });

  it('расход по чужой партии не смешивается', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveUsage({ partyUuid: 'p1', inputTokens: 100, outputTokens: 200, costUsd: 0.01, usedFallback: false });

    expect(storage.totalUsage('p2')).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
  });

  it('удаление партии убирает её из базы', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveParty({ uuid: 'p1', theme: 'станция', document: makeState() });
    storage.removeParty('p1');

    expect(storage.loadParty('p1')).toBeNull();
  });
});
