import type {
  TCtx,
  TG,
  TPlayerId,
} from './state';
import type { TTheme } from './content';

// Состояние глазами одного игрока. Ни состояния генератора случайных чисел,
// ни журнала партии здесь нет: первое позволило бы предсказать все броски,
// второй за партию разрастается на сотни строк и не нужен целиком
export interface TStateForPlayer {
  G: Omit<TG, 'log' | 'random'>;
  ctx: TCtx;
  stateId: number;
  you: TPlayerId;
}

export enum EPartyPhase {
  ENDED = 'ENDED',
  GENERATING = 'GENERATING',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
}

export interface TLobbyMember {
  playerId: TPlayerId;
  nickname: string;
  isConnected: boolean;
  // Предложил тему или отказался предлагать. Отдельной готовности нет:
  // ответ про тему и есть сигнал готовности
  hasAnswered: boolean;
  // Видно всем до жеребьёвки: на чужую выдумку хочется ответить своей
  themeProposal?: string;
}

export interface TPartyView {
  partyId: string;
  phase: EPartyPhase;
  members: TLobbyMember[];
  ownerId: TPlayerId;
  you: TPlayerId;
  // Появляется, как только готова стадия «Мир», раньше состояния партии
  theme?: TTheme;
  // Появляется с началом игры
  state?: TStateForPlayer;
  usedFallback: boolean;
  // Появляется, когда с этой партии начали новую тем же составом: клиенту
  // нужно знать, куда идти. Номер партии — машинные данные, и в строке ленты,
  // написанной для человека, ему не место
  nextPartyId?: string;
}
