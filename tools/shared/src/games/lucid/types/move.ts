import type { TPlayerId } from './state';

export enum EMoveType {
  BUY_CARD = 'BUY_CARD',
  CHOOSE_BRANCH = 'CHOOSE_BRANCH',
  CHOOSE_DIE = 'CHOOSE_DIE',
  CHOOSE_LAW = 'CHOOSE_LAW',
  CHOOSE_OPTION = 'CHOOSE_OPTION',
  END_TURN = 'END_TURN',
  OPEN_SAFE = 'OPEN_SAFE',
  PLAY_CARD = 'PLAY_CARD',
  ROLL = 'ROLL',
}

// stateId — версия состояния, на которой игрок принимал решение.
// Не совпала с текущей, значит клиент отстал, и ход отклоняется
export type TMove =
  | { type: EMoveType.ROLL; playerId: TPlayerId; stateId: number }
  | { type: EMoveType.BUY_CARD; playerId: TPlayerId; stateId: number; index: number | null; discardUid?: number }
  | { type: EMoveType.CHOOSE_BRANCH; playerId: TPlayerId; stateId: number; cellId: number }
  | { type: EMoveType.CHOOSE_DIE; playerId: TPlayerId; stateId: number; dieIndex: number }
  | { type: EMoveType.CHOOSE_LAW; playerId: TPlayerId; stateId: number; index: number }
  | { type: EMoveType.CHOOSE_OPTION; playerId: TPlayerId; stateId: number; optionIndex: number }
  | { type: EMoveType.END_TURN; playerId: TPlayerId; stateId: number }
  | { type: EMoveType.PLAY_CARD; playerId: TPlayerId; stateId: number; uid: number; targetId?: TPlayerId }
  | { type: EMoveType.OPEN_SAFE; playerId: TPlayerId; stateId: number; bonus: number };
