import type { TTrack } from './track';
import type { TRandomState } from './random';
import type { TEvent, TTheme } from './content';

export type TPlayerId = string;

export interface TPlayer {
  id: TPlayerId;
  nickname: string;
  position: number;
  resource: number;
  skipTurns: number;
  // Роль в мире партии, придуманная нейросетью в честь игрока. Необязательна:
  // модель могла не прислать роль на всех, а партии, сгенерированные раньше,
  // лежат в базе вовсе без ролей
  role?: string;
}

export enum EPhase {
  BRANCH = 'BRANCH',
  CHOICE = 'CHOICE',
  ENDED = 'ENDED',
  ROLL = 'ROLL',
}

// Последний бросок кубика в партии. Нужен клиенту, чтобы нарисовать грань и
// озвучить бросок. Разбирать строку журнала регулярным выражением нельзя:
// текст журнала предназначен человеку и меняется свободно
export interface TRoll {
  playerId: TPlayerId;
  value: number;
  // Есть, если бросок был проверкой варианта события, а не броском на движение
  threshold?: number;
}

// Ветка варианта — единица раскрытия исхода. Без порога срабатывает всегда
// success; с порогом — success при броске ≥ threshold, иначе failure (даже
// если failure не описан — тогда сработавшая ветка считается «пустой»)
export type TBranch = 'success' | 'failure';

// Запись истории одного разыгранного варианта на клетке. Строки — тот же
// прирост G.log, что породил этот выбор: сам выбор, бросок (если был)
// и применённые эффекты — секретов внутри нет, это уже случившееся
export interface THistoryEntry {
  playerId: TPlayerId;
  nickname: string;
  optionIndex: number;
  branch: TBranch;
  roll?: number;
  lines: string[];
}

export interface TG {
  players: Record<TPlayerId, TPlayer>;
  order: TPlayerId[];
  track: TTrack;
  // Копия исходного контента из TPartyContent, снятая при начале партии.
  // Дальше партия развивается независимо от исходных данных
  events: Record<number, TEvent>;
  theme: TTheme;
  random: TRandomState;
  // Клетки, содержимое которых уже открыто всем
  visited: number[];
  log: string[];
  winner?: TPlayerId;
  // Оба поля относятся к текущему игроку из ctx.currentPlayer, а не к каждому:
  // одновременно в развилке может стоять только один игрок, словарь по игрокам не нужен.
  // Куда игрок может шагнуть с развилки, на которой остановлено движение
  branchChoices: number[];
  // Сколько шагов осталось дойти после выбора ветки
  pendingSteps: number;
  lastRoll?: TRoll;
  // История разыгранных вариантов по клеткам — источник раскрытых веток
  // (какая из success/failure уже случалась на этой клетке) и посещённой
  // истории для просмотра клетки. Ключ — cellId
  cellHistory: Record<number, THistoryEntry[]>;
}

export interface TCtx {
  currentPlayer: TPlayerId;
  turn: number;
  numPlayers: number;
  phase: EPhase;
}

export interface TState {
  G: TG;
  ctx: TCtx;
  // Монотонная версия состояния: клиент присылает её с ходом, устаревшие ходы отклоняются
  stateId: number;
}
