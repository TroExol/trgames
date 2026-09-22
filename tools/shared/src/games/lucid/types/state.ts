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
