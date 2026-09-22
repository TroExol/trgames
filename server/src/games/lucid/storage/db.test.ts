import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import type { TStorage } from '@/games/lucid/storage/db';

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

  it('удаление партии убирает её из базы', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveParty({ uuid: 'p1', theme: 'станция', document: makeState() });
    storage.removeParty('p1');

    expect(storage.loadParty('p1')).toBeNull();
  });
});

const callParams = (overrides: Partial<Parameters<TStorage<unknown>['saveGenerationCall']>[0]> = {}) => ({
  partyUuid: 'p1',
  stage: 'world' as const,
  model: 'test/model',
  attempt: 1,
  inputTokens: 10,
  outputTokens: 20,
  costUsd: 0.01,
  durationMs: 500,
  outcome: 'ok' as const,
  ...overrides,
});

const generationParams = (overrides: Partial<Parameters<TStorage<unknown>['saveGeneration']>[0]> = {}) => ({
  partyUuid: 'p1',
  model: 'test/model',
  usedFallback: false,
  durationMs: 1_000,
  requestedEvents: 6,
  callsCount: 1,
  retriesCount: 0,
  paidOptionShare: 0.5,
  antiLeaderShare: 0.25,
  helpLastShare: 0.25,
  ...overrides,
});

describe('generationCalls и generations', () => {
  it('пустая база отдаёт totals как null', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    expect(storage.usageReport()).toEqual({ totals: null, byDay: [], byModel: [], recent: [] });
  });

  it('итоги считают вызовы, токены, стоимость и перегенерации', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveGenerationCall(callParams({ inputTokens: 10, outputTokens: 20, costUsd: 0.01 }));
    storage.saveGenerationCall(callParams({ attempt: 2, inputTokens: 5, outputTokens: 5, costUsd: 0.002 }));
    storage.saveGeneration(generationParams({ durationMs: 100, retriesCount: 1 }));
    storage.saveGeneration(generationParams({ partyUuid: 'p2', durationMs: 300, usedFallback: true }));

    const { totals } = storage.usageReport();

    expect(totals).toEqual({
      generations: 2,
      calls: 2,
      inputTokens: 15,
      outputTokens: 25,
      costUsd: 0.012,
      fallbackShare: 0.5,
      durationMedianMs: 200,
      durationWorstMs: 300,
      retries: 1,
    });
  });

  it('группировка по моделям считает долю ошибок и среднюю длительность', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveGenerationCall(callParams({ model: 'a', durationMs: 100, outcome: 'ok' }));
    storage.saveGenerationCall(callParams({ model: 'a', durationMs: 300, outcome: 'error' }));
    storage.saveGenerationCall(callParams({ model: 'b', durationMs: 50, outcome: 'ok' }));
    storage.saveGeneration(generationParams());

    const { byModel } = storage.usageReport();

    expect(byModel).toEqual([
      { model: 'a', calls: 2, costUsd: 0.02, avgDurationMs: 200, errorShare: 0.5 },
      { model: 'b', calls: 1, costUsd: 0.01, avgDurationMs: 50, errorShare: 0 },
    ]);
  });

  it('последние генерации несут название мира из таблицы партий и свою стоимость', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    // Лобби сохраняется без темы, настоящая приходит вторым сохранением после
    // генерации — ON CONFLICT обязан её обновить, а не оставить пустой
    storage.saveParty({ uuid: 'p1', theme: '', document: makeState() });
    storage.saveParty({ uuid: 'p1', theme: 'Пиратская бухта', document: makeState() });
    storage.saveGenerationCall(callParams({ costUsd: 0.03 }));
    storage.saveGeneration(generationParams({ retriesCount: 2 }));

    const { recent } = storage.usageReport();

    expect(recent).toEqual([
      expect.objectContaining({
        worldName: 'Пиратская бухта',
        model: 'test/model',
        costUsd: 0.03,
        usedFallback: false,
        retriesCount: 2,
      }),
    ]);
  });
});
