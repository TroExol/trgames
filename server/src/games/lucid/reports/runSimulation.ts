import type { LucidShared } from '@trgames/shared';

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

import type { TSimulationMode } from '@/games/lucid/reports/simulate';

import { runSimulation, SIMULATION_MODES } from '@/games/lucid/reports/simulate';
import { STORAGE_PATH } from '@/games/lucid/init';

interface TPartyDocument {
  usedFallback: boolean;
  state?: { G?: { events?: Record<string, LucidShared.TEvent> } };
}

const DEFAULT_COUNT = 60;

const loadGeneratedEvents = (): LucidShared.TEvent[] => {
  if (!existsSync(STORAGE_PATH)) {
    throw new Error(`Нет файла базы ${STORAGE_PATH}: события модели читаются из таблицы parties`);
  }

  const db = new DatabaseSync(STORAGE_PATH, { readOnly: true });
  const rows = db.prepare('SELECT state FROM parties').all() as { state: string }[];

  db.close();

  const events = rows
    .map(row => JSON.parse(row.state) as TPartyDocument)
    .filter(document => !document.usedFallback)
    .flatMap(document => Object.values(document.state?.G?.events ?? {}));

  if (!events.length) {
    throw new Error(`В ${STORAGE_PATH} нет партий с событиями модели`);
  }

  return events;
};

const args = process.argv.slice(2);
const [mode = 'base', countArg] = args.filter(arg => !arg.startsWith('--'));

if (!SIMULATION_MODES.includes(mode as TSimulationMode)) {
  throw new Error(`Режим ${mode} неизвестен, доступны: ${SIMULATION_MODES.join(', ')}`);
}

const count = Number(countArg ?? DEFAULT_COUNT);

if (!Number.isInteger(count) || count < 1) {
  throw new Error(`Число партий должно быть целым и больше нуля: ${countArg}`);
}

const events = args.includes('--generated') ? loadGeneratedEvents() : [];

console.log(`События: ${events.length ? `модель, ${events.length}` : 'запасной пул'}`);
console.log(runSimulation({ mode: mode as TSimulationMode, count, events }).join('\n'));
