import type * as NodeFs from 'node:fs';
import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
  worldName: 'Тестовый мир',
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

  it('по дням суммирует стоимость реально сделанных в этот день вызовов', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    vi.setSystemTime(new Date(2026, 0, 10, 12));
    storage.saveGenerationCall(callParams({ costUsd: 0.01 }));
    storage.saveGeneration(generationParams());

    // Второй день: две генерации не было — только два вызова и одна
    // генерация, стоимость дня всё равно должна сложить оба вызова
    vi.setSystemTime(new Date(2026, 0, 11, 12));
    storage.saveGenerationCall(callParams({ costUsd: 0.02 }));
    storage.saveGenerationCall(callParams({ costUsd: 0.03 }));
    storage.saveGeneration(generationParams());

    const { byDay } = storage.usageReport();

    expect(byDay).toEqual([
      { day: '2026-01-11', generations: 1, costUsd: 0.05 },
      { day: '2026-01-10', generations: 1, costUsd: 0.01 },
    ]);
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

  it('последние генерации несут своё название мира и свою стоимость', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    storage.saveGenerationCall(callParams({ costUsd: 0.03 }));
    storage.saveGeneration(generationParams({ retriesCount: 2, worldName: 'Пиратская бухта' }));

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

  it('название мира остаётся в отчёте, даже когда строка партии уже удалена уборкой', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');

    // Уборка удаляет parties через несколько минут после опустения комнаты
    // (cleanup.ts) — задолго до того, как кто-то откроет отчёт
    storage.saveParty({ uuid: 'p1', theme: 'Пиратская бухта', document: makeState() });
    storage.saveGeneration(generationParams({ worldName: 'Пиратская бухта' }));
    storage.removeParty('p1');

    expect(storage.usageReport().recent[0].worldName).toBe('Пиратская бухта');
  });
});

describe('открытие базы старого формата', () => {
  it(
    'база с parties/usage и generations без world_name открывается, мигрирует колонку и не теряет старые строки',
    async () => {
      // fs замокан глобально (setup.ts, память через memfs) — для настоящего
      // файла на диске, который увидит нативный node:sqlite, нужен настоящий fs
      const realFs = await vi.importActual<typeof NodeFs>('node:fs');

      // :memory: не годится: нужна база, которую можно закрыть одним
      // подключением и переоткрыть другим, как это делает сервер между запусками
      const dir = realFs.mkdtempSync(join(tmpdir(), 'lucid-legacy-'));
      const path = join(dir, 'legacy.db');

      try {
        // Две старые схемы разом: parties/usage — то, что накоплено в боевых
        // базах до этой ветки; generations без world_name — промежуточная
        // версия этой же ветки (более ранний коммит, колонка появилась позже
        // самой таблицы)
        const legacy = new DatabaseSync(path);

        legacy.exec(`
          CREATE TABLE parties (
            uuid TEXT PRIMARY KEY,
            theme TEXT NOT NULL,
            state TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            party_uuid TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            cost_usd REAL NOT NULL,
            used_fallback INTEGER NOT NULL,
            created_at INTEGER NOT NULL
          );

          CREATE TABLE generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            party_uuid TEXT NOT NULL,
            model TEXT NOT NULL,
            used_fallback INTEGER NOT NULL,
            duration_ms INTEGER NOT NULL,
            requested_events INTEGER NOT NULL,
            calls_count INTEGER NOT NULL,
            retries_count INTEGER NOT NULL,
            paid_option_share REAL NOT NULL,
            anti_leader_share REAL NOT NULL,
            help_last_share REAL NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);
        legacy.prepare(`
          INSERT INTO usage (party_uuid, input_tokens, output_tokens, cost_usd, used_fallback, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('old-party', 100, 200, 0.01, 0, 1_700_000_000_000);
        legacy.prepare(`
          INSERT INTO generations (
            party_uuid, model, used_fallback, duration_ms, requested_events,
            calls_count, retries_count, paid_option_share, anti_leader_share, help_last_share, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('old-gen', 'old/model', 0, 100, 1, 1, 0, 0, 0, 0, 1_700_000_000_000);
        legacy.close();

        // Открываем тем же кодом, что и сервер: CREATE TABLE IF NOT EXISTS
        // и миграция world_name не должны споткнуться об уже существующие
        // parties/usage/generations
        const storage = createStorage<LucidShared.TState>(path);

        expect(() => {
          storage.saveGenerationCall(callParams());
          storage.saveGeneration(generationParams({ worldName: 'Новый мир' }));
        }).not.toThrow();

        const report = storage.usageReport();

        // Старая строка generations (без world_name) и новая — обе на месте
        expect(report.totals).toEqual(expect.objectContaining({ generations: 2, calls: 1 }));
        expect(report.recent.map(row => row.worldName).sort()).toEqual(['', 'Новый мир']);
        storage.close();

        // Старая usage — не удалена и не переписана: новый код в неё не пишет
        const check = new DatabaseSync(path);
        const legacyRows = check.prepare('SELECT * FROM usage').all() as { party_uuid: string }[];
        check.close();

        expect(legacyRows).toHaveLength(1);
        expect(legacyRows[0].party_uuid).toBe('old-party');
      } finally {
        // Соединения закрыты выше, поэтому на Windows файл уже не занят
        realFs.rmSync(dir, { recursive: true, force: true });
      }
    },
  );
});
