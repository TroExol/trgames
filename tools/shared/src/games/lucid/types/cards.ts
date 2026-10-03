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

export enum EShopCard {
  CLOVER = 'CLOVER',
  GRENADE = 'GRENADE',
  HAND_OF_FATE = 'HAND_OF_FATE',
  HARPOON = 'HARPOON',
  HOOK = 'HOOK',
  MAGIC_DIE = 'MAGIC_DIE',
  MONEY_MAGNET = 'MONEY_MAGNET',
  ROCKET = 'ROCKET',
  TRAVELATOR = 'TRAVELATOR',
  VOODOO = 'VOODOO',
}

export interface THandCard {
  uid: number;
  card: EShopCard;
}

export interface TCards {
  laws: (ELaw | null)[];
  lawDeck: ELaw[];
  lawDiscard: ELaw[];
  lawDraw: ELaw[];
  shopDeck: THandCard[];
  shopDiscard: THandCard[];
  shopOffer: THandCard[];
  hands: Record<string, THandCard[]>;
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
  used: number[];
  eventCellId?: number;
  lawEvent?: TEvent;
}
