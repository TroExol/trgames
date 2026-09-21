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
}

export enum EPhase {
  BRANCH = 'BRANCH',
  CHOICE = 'CHOICE',
  ENDED = 'ENDED',
  ROLL = 'ROLL',
}

export interface TG {
  players: Record<TPlayerId, TPlayer>;
  order: TPlayerId[];
  track: TTrack;
  // Копия исходного контента из TPartyContent, снята при начале партии.
  // Дальше партия развивается независимо от исходных данных
  events: Record<number, TEvent>;
  // Копия исходного контента из TPartyContent, снята при начале партии.
  // Дальше партия развивается независимо от исходных данных
  theme: TTheme;
  random: TRandomState;
  // Клетки, содержимое которых уже открыто всем
  visited: number[];
  log: string[];
  winner?: TPlayerId;
  // Относятся к текущему игроку (ctx.currentPlayer), а не к каждому игроку.
  // Одновременно в развилке может стоять только один игрок.
  // Куда игрок может шагнуть с развилки, на которой остановлено движение
  branchChoices: number[];
  // Относятся к текущему игроку (ctx.currentPlayer), а не к каждому игроку.
  // Одновременно в развилке может стоять только один игрок.
  // Сколько шагов осталось дойти после выбора ветки
  pendingSteps: number;
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
