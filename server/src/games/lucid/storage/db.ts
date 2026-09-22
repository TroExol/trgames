import { DatabaseSync } from 'node:sqlite';

import type { TGenerationCallInfo } from '@/games/lucid/generation/pipeline';
import type { TContentMetrics } from '@/games/lucid/generation/contentMetrics';

interface TSavePartyParams<TDocument> {
  uuid: string;
  // Тема сохраняется вместе с партией: основа будущей модерации
  theme: string;
  document: TDocument;
}

type TSaveGenerationCallParams = { partyUuid: string } & TGenerationCallInfo;

type TSaveGenerationParams = {
  partyUuid: string;
  model: string;
  usedFallback: boolean;
  durationMs: number;
  requestedEvents: number;
  callsCount: number;
  retriesCount: number;
} & TContentMetrics;

export interface TUsageTotals {
  generations: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  fallbackShare: number;
  durationMedianMs: number;
  durationWorstMs: number;
  retries: number;
}

export interface TUsageByDay {
  day: string;
  generations: number;
  costUsd: number;
}

export interface TUsageByModel {
  model: string;
  calls: number;
  costUsd: number;
  avgDurationMs: number;
  errorShare: number;
}

export interface TRecentGeneration {
  createdAt: number;
  worldName: string;
  model: string;
  durationMs: number;
  costUsd: number;
  usedFallback: boolean;
  paidOptionShare: number;
  antiLeaderShare: number;
  helpLastShare: number;
  retriesCount: number;
}

export interface TUsageReport {
  // null, если генераций ещё не было ни одной
  totals: TUsageTotals | null;
  byDay: TUsageByDay[];
  byModel: TUsageByModel[];
  recent: TRecentGeneration[];
}

// Сортированный массив на входе: медиана нужна только отчёту, и он же
// сортирует то, что достаёт из базы
const median = (sorted: number[]): number => {
  if (sorted.length === 0) {
    return 0;
  }

  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

// Хранилище обобщено по типу документа: что положили, то и достанем, и
// компилятор это проверяет. Отдельной таблицы под комнату нет — вид документа
// у нас один, вторая таблица окупится только с появлением третьего
export const createStorage = <TDocument>(path: string) => {
  const db = new DatabaseSync(path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      uuid TEXT PRIMARY KEY,
      theme TEXT NOT NULL,
      state TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_uuid TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      used_fallback INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generation_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_uuid TEXT NOT NULL,
      stage TEXT NOT NULL,
      model TEXT NOT NULL,
      attempt INTEGER NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      duration_ms INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      error_message TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generations (
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

  return {
    saveParty: ({ uuid, theme, document }: TSavePartyParams<TDocument>): void => {
      db.prepare(`
        INSERT INTO parties (uuid, theme, state, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET theme = excluded.theme, state = excluded.state, updated_at = excluded.updated_at
      `).run(uuid, theme, JSON.stringify(document), Date.now());
    },

    loadParty: (uuid: string): TDocument | null => {
      const row = db.prepare('SELECT state FROM parties WHERE uuid = ?').get(uuid) as
        | { state: string }
        | undefined;

      return row ? JSON.parse(row.state) as TDocument : null;
    },

    removeParty: (uuid: string): void => {
      db.prepare('DELETE FROM parties WHERE uuid = ?').run(uuid);
    },

    // Пишется сразу же, как вызов модели завершился — успехом, невалидным
    // ответом или ошибкой. Не ждёт исхода всей генерации: кусок, долетевший
    // уже после того, как generateContent взял запасную партию, тоже попадёт сюда
    saveGenerationCall: ({
      partyUuid,
      stage,
      model,
      attempt,
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
      outcome,
      errorMessage,
    }: TSaveGenerationCallParams): void => {
      db.prepare(`
        INSERT INTO generation_calls (
          party_uuid, stage, model, attempt, input_tokens, output_tokens,
          cost_usd, duration_ms, outcome, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        partyUuid,
        stage,
        model,
        attempt,
        inputTokens,
        outputTokens,
        costUsd,
        durationMs,
        outcome,
        errorMessage ?? null,
        Date.now(),
      );
    },

    // Пишется один раз, когда генерация закончилась целиком — и для удачной,
    // и для запасной партии
    saveGeneration: ({
      partyUuid,
      model,
      usedFallback,
      durationMs,
      requestedEvents,
      callsCount,
      retriesCount,
      paidOptionShare,
      antiLeaderShare,
      helpLastShare,
    }: TSaveGenerationParams): void => {
      db.prepare(`
        INSERT INTO generations (
          party_uuid, model, used_fallback, duration_ms, requested_events,
          calls_count, retries_count, paid_option_share, anti_leader_share, help_last_share, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        partyUuid,
        model,
        usedFallback ? 1 : 0,
        durationMs,
        requestedEvents,
        callsCount,
        retriesCount,
        paidOptionShare,
        antiLeaderShare,
        helpLastShare,
        Date.now(),
      );
    },

    // Агрегация для команды-отчёта: генераций ещё не было — totals пуст,
    // и вызывающая сторона печатает «данных пока нет» вместо таблиц
    usageReport: (): TUsageReport => {
      const generationsCount = (
        db.prepare('SELECT COUNT(*) AS count FROM generations').get() as { count: number }
      ).count;

      if (generationsCount === 0) {
        return {
          totals: null,
          byDay: [],
          byModel: [],
          recent: [],
        };
      }

      const callTotals = db.prepare(`
        SELECT COUNT(*) AS calls,
               COALESCE(SUM(input_tokens), 0) AS input_tokens,
               COALESCE(SUM(output_tokens), 0) AS output_tokens,
               COALESCE(SUM(cost_usd), 0) AS cost_usd
        FROM generation_calls
      `).get() as { calls: number; input_tokens: number; output_tokens: number; cost_usd: number };

      const generationTotals = db.prepare(`
        SELECT COALESCE(AVG(used_fallback), 0) AS fallback_share,
               COALESCE(SUM(retries_count), 0) AS retries
        FROM generations
      `).get() as { fallback_share: number; retries: number };

      // sqlite не считает медиану сама — тянем длительности и находим её в JS
      const durations = (db.prepare('SELECT duration_ms FROM generations').all() as { duration_ms: number }[])
        .map(row => row.duration_ms)
        .sort((a, b) => a - b);

      const totals: TUsageTotals = {
        generations: generationsCount,
        calls: callTotals.calls,
        inputTokens: callTotals.input_tokens,
        outputTokens: callTotals.output_tokens,
        costUsd: callTotals.cost_usd,
        fallbackShare: generationTotals.fallback_share,
        durationMedianMs: median(durations),
        durationWorstMs: durations[durations.length - 1] ?? 0,
        retries: generationTotals.retries,
      };

      const byDayGenerations = db.prepare(`
        SELECT date(created_at / 1000, 'unixepoch') AS day, COUNT(*) AS count
        FROM generations GROUP BY day
      `).all() as { day: string; count: number }[];

      // Стоимость дня — это сумма реально сделанных в этот день вызовов,
      // а не вызовов, привязанных к генерациям, начавшимся в этот день: так
      // строка дня честно отражает то, что провайдер выставил бы за эти сутки
      const byDayCost = db.prepare(`
        SELECT date(created_at / 1000, 'unixepoch') AS day, COALESCE(SUM(cost_usd), 0) AS cost_usd
        FROM generation_calls GROUP BY day
      `).all() as { day: string; cost_usd: number }[];
      const costByDay = new Map(byDayCost.map(row => [row.day, row.cost_usd]));

      const byDay: TUsageByDay[] = byDayGenerations
        .map(row => ({ day: row.day, generations: row.count, costUsd: costByDay.get(row.day) ?? 0 }))
        .sort((a, b) => b.day.localeCompare(a.day));

      const byModel: TUsageByModel[] = (db.prepare(`
        SELECT model, COUNT(*) AS calls,
               COALESCE(SUM(cost_usd), 0) AS cost_usd,
               COALESCE(AVG(duration_ms), 0) AS avg_duration_ms,
               CAST(SUM(CASE WHEN outcome = 'error' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS error_share
        FROM generation_calls
        GROUP BY model
        ORDER BY calls DESC
      `).all() as {
        model: string;
        calls: number;
        cost_usd: number;
        avg_duration_ms: number;
        error_share: number;
      }[]).map(row => ({
        model: row.model,
        calls: row.calls,
        costUsd: row.cost_usd,
        avgDurationMs: row.avg_duration_ms,
        errorShare: row.error_share,
      }));

      // party_uuid у generations почти всегда уникален: перегенерация одной
      // и той же партии (после abortStart) — редкость, которой здесь
      // намеренно пренебрегаем ради простоты запроса
      const recent: TRecentGeneration[] = (db.prepare(`
        SELECT g.created_at AS created_at, g.model AS model, g.duration_ms AS duration_ms,
               g.used_fallback AS used_fallback, g.paid_option_share AS paid_option_share,
               g.anti_leader_share AS anti_leader_share, g.help_last_share AS help_last_share,
               g.retries_count AS retries_count,
               COALESCE(p.theme, '') AS world_name,
               COALESCE(
                 (SELECT SUM(c.cost_usd) FROM generation_calls c WHERE c.party_uuid = g.party_uuid),
                 0
               ) AS cost_usd
        FROM generations g
        LEFT JOIN parties p ON p.uuid = g.party_uuid
        ORDER BY g.created_at DESC
        LIMIT 10
      `).all() as {
        created_at: number;
        model: string;
        duration_ms: number;
        used_fallback: number;
        paid_option_share: number;
        anti_leader_share: number;
        help_last_share: number;
        retries_count: number;
        world_name: string;
        cost_usd: number;
      }[]).map(row => ({
        createdAt: row.created_at,
        worldName: row.world_name,
        model: row.model,
        durationMs: row.duration_ms,
        costUsd: row.cost_usd,
        usedFallback: Boolean(row.used_fallback),
        paidOptionShare: row.paid_option_share,
        antiLeaderShare: row.anti_leader_share,
        helpLastShare: row.help_last_share,
        retriesCount: row.retries_count,
      }));

      return {
        totals,
        byDay,
        byModel,
        recent,
      };
    },
  };
};

export type TStorage<TDocument> = ReturnType<typeof createStorage<TDocument>>;
