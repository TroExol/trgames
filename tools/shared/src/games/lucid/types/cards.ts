import type { TEvent } from './content';

export enum ELaw {
  DOUBLE_AGAIN = 'DOUBLE_AGAIN',
  GREEN_ADVANCE = 'GREEN_ADVANCE',
  GREEN_AGAIN = 'GREEN_AGAIN',
  GREEN_GOOD = 'GREEN_GOOD',
  GREEN_RESOURCE = 'GREEN_RESOURCE',
  LAST_END_ADVANCE = 'LAST_END_ADVANCE',
  LAST_END_DIE = 'LAST_END_DIE',
  LAST_START_FREE_CARD = 'LAST_START_FREE_CARD',
  LAST_START_GOOD = 'LAST_START_GOOD',
  LAST_START_RESOURCE = 'LAST_START_RESOURCE',
  OVERTAKE_STEAL = 'OVERTAKE_STEAL',
  RED_BAD = 'RED_BAD',
  RED_CHOICE = 'RED_CHOICE',
  RED_PAY_ALL = 'RED_PAY_ALL',
  SIX_SKIP = 'SIX_SKIP',
}

export interface TCards {
  laws: (ELaw | null)[];
  lawDeck: ELaw[];
  lawDiscard: ELaw[];
  lawDraw: ELaw[];
}

export enum ETurnStep {
  CARDS = 'CARDS',
  END = 'END',
  LANDED = 'LANDED',
  START = 'START',
}

export interface TTurn {
  step: ETurnStep;
  landedCellId?: number;
  from?: number;
  fired: ELaw[];
  extraTurn: boolean;
  eventCellId?: number;
  lawEvent?: TEvent;
}
