import type { TStoneShard } from './stoneShard';
import type { TCard } from './card';
import type { TAbility } from './ability';

export interface TPlayer {
  seals: TCard[];
  discard: TCard[];
  companion: TCard | undefined;
  hand: TCard[] | undefined;
  arena: TCard[] | undefined;
  countDeck: number;
  countHand: number;
  abilities: TAbility[];
  stoneShards: TStoneShard[];
  hasDarknessCrown: boolean;
  hasNoctullos: boolean;
  health: number;
  nickname: string;
  essenceToSpend: number | undefined;
  essenceOfHand: number | undefined;
  gloryShards: number | undefined;
  isOnline: boolean;
  isReady: boolean;
}
