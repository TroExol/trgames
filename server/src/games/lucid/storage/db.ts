import type { LucidShared } from '@trgames/shared';

import { DatabaseSync } from 'node:sqlite';

interface TSavePartyParams {
  uuid: string;
  // Тема сохраняется вместе с партией: основа будущей модерации
  theme: string;
  state: LucidShared.TState;
}

interface TSaveUsageParams {
  partyUuid: string;
  inputTokens: number;
  outputTokens: number;
  usedFallback: boolean;
}

export const createStorage = (path: string) => {
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
      used_fallback INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  return {
    saveParty: ({ uuid, theme, state }: TSavePartyParams): void => {
      db.prepare(`
        INSERT INTO parties (uuid, theme, state, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
      `).run(uuid, theme, JSON.stringify(state), Date.now());
    },

    loadParty: (uuid: string): LucidShared.TState | null => {
      const row = db.prepare('SELECT state FROM parties WHERE uuid = ?').get(uuid) as
        | { state: string }
        | undefined;

      return row ? JSON.parse(row.state) as LucidShared.TState : null;
    },

    removeParty: (uuid: string): void => {
      db.prepare('DELETE FROM parties WHERE uuid = ?').run(uuid);
    },

    saveUsage: ({
      partyUuid,
      inputTokens,
      outputTokens,
      usedFallback,
    }: TSaveUsageParams): void => {
      db.prepare(`
        INSERT INTO usage (party_uuid, input_tokens, output_tokens, used_fallback, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(partyUuid, inputTokens, outputTokens, usedFallback ? 1 : 0, Date.now());
    },

    totalUsage: (partyUuid: string) => {
      const row = db.prepare(`
        SELECT COALESCE(SUM(input_tokens), 0) AS input_tokens,
               COALESCE(SUM(output_tokens), 0) AS output_tokens
        FROM usage WHERE party_uuid = ?
      `).get(partyUuid) as { input_tokens: number; output_tokens: number };

      return { inputTokens: row.input_tokens, outputTokens: row.output_tokens };
    },
  };
};

export type TStorage = ReturnType<typeof createStorage>;
