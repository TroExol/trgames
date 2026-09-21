import type { TTrack } from './track';
import type { TRandomState } from './random';
import type { TEvent, TTheme } from './content';

export type TPlayerId = string;

export type TPlayer = {
  id: TPlayerId;
  nickname: string;
  position: number;
  resource: number;
  skipTurns: number;
};

export enum EPhase {
  BRANCH = 'BRANCH',
  CHOICE = 'CHOICE',
  ENDED = 'ENDED',
  ROLL = 'ROLL',
}

export type TG = {
  players: Record<TPlayerId, TPlayer>;
  order: TPlayerId[];
  track: TTrack;
  events: Record<number, TEvent>;
  theme: TTheme;
  random: TRandomState;
  // Клетки, содержимое которых уже открыто всем
  visited: number[];
  log: string[];
  winner?: TPlayerId;
  // Куда игрок может шагнуть с развилки, на которой остановлено движение
  branchChoices: number[];
  // Сколько шагов осталось дойти после выбора ветки
  pendingSteps: number;
};

export type TCtx = {
  currentPlayer: TPlayerId;
  turn: number;
  numPlayers: number;
  phase: EPhase;
};

export type TState = {
  G: TG;
  ctx: TCtx;
  // Монотонная версия состояния: клиент присылает её с ходом, устаревшие ходы отклоняются
  stateId: number;
};
