import type { TStoneShard } from './stoneShard';
import type { TPlayer } from './player';
import type { TDarknessCrown } from './darknessCrown';
import type { TCard } from './card';
import type { TAbility } from './ability';

export interface TRoomSettings {
  maxPlayers: number;
  maxMarket: number;
  password?: string;
}

export interface TRoom {
  uuid: string;
  darknessCrown: TDarknessCrown;
  activeChaos: TCard | undefined;
  activePlayerNickname: string | undefined;
  adminNickname: string | undefined;
  countDeck: number;
  playerNickname: string;
  isGameEnded: boolean;
  endedAt?: number;
  countHarbingers: number;
  countViewers: number;
  harbinger: TCard | undefined;
  name: string;
  players: TPlayer[];
  abilities: TAbility[];
  removed: {
    cards: TCard[];
    chaos: TCard[];
  };
  market: TCard[];
  stoneShards: TStoneShard[];
  darknessMadness: TCard[];
  cursedSeal: TCard[];
  isGameStarted: boolean;
  startedAt?: number;
  pendingAckNicknames: string[];
}

export interface TRoomShort {
  uuid: string;
  name: string;
  playerNicknames: string[];
  countViewers: number;
  countOnlinePlayers: number;
  settings: Omit<TRoomSettings, 'password'>;
  startedAt?: number;
  endedAt?: number;
  isGameStarted: boolean;
  isGameEnded: boolean;
  isWithPassword: boolean;
}
