import type { TPlayerId } from './state';

export enum EMoveType {
  CHOOSE_BRANCH = 'CHOOSE_BRANCH',
  CHOOSE_DIE = 'CHOOSE_DIE',
  CHOOSE_OPTION = 'CHOOSE_OPTION',
  OPEN_SAFE = 'OPEN_SAFE',
  ROLL = 'ROLL',
}

// stateId — версия состояния, на которой игрок принимал решение.
// Не совпала с текущей, значит клиент отстал, и ход отклоняется
export type TMove =
  | { type: EMoveType.ROLL; playerId: TPlayerId; stateId: number }
  | { type: EMoveType.CHOOSE_BRANCH; playerId: TPlayerId; stateId: number; cellId: number }
  | { type: EMoveType.CHOOSE_DIE; playerId: TPlayerId; stateId: number; dieIndex: number }
  | { type: EMoveType.CHOOSE_OPTION; playerId: TPlayerId; stateId: number; optionIndex: number }
  | { type: EMoveType.OPEN_SAFE; playerId: TPlayerId; stateId: number; bonus: number };
