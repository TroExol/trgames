import type { TPlayerId } from './state';

export enum EMoveType {
  CHOOSE_BRANCH = 'CHOOSE_BRANCH',
  CHOOSE_OPTION = 'CHOOSE_OPTION',
  ROLL = 'ROLL',
}

// stateId — версия состояния, на которой игрок принимал решение.
// Не совпала с текущей, значит клиент отстал, и ход отклоняется
export type TMove =
  | { type: EMoveType.ROLL; playerId: TPlayerId; stateId: number }
  | { type: EMoveType.CHOOSE_BRANCH; playerId: TPlayerId; stateId: number; cellId: number }
  | { type: EMoveType.CHOOSE_OPTION; playerId: TPlayerId; stateId: number; optionIndex: number };
