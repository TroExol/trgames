import type { TStoneShardId } from '../types/stoneShard';
import type { EModalTypes } from '../types/modal';
import type { ECardId } from '../types/card';
import type { TAbilityId } from '../types/ability';
import type { EGame } from '../../types';

export enum EAnalyticsEvent {
  ABILITY_PLAYED = 'ability_played',
  CARD_BOUGHT_COMPANION = 'card_bought_companion',
  CARD_BOUGHT_DARKNESS_MADNESS = 'card_bought_darkness_madness',
  CARD_BOUGHT_HARBINGER = 'card_bought_harbinger',
  CARD_BOUGHT_MARKET = 'card_bought_market',
  CARD_PLAYED = 'card_played',
  GAME_ENDED = 'game_ended',
  GAME_STARTED = 'game_started',
  MESSAGE_SENT = 'message_sent',
  MODAL_RESPONDED = 'modal_responded',
  MODAL_SHOWN = 'modal_shown',
  PLAYER_READY_TOGGLED = 'player_ready_toggled',
  PLAYER_REMOVED = 'player_removed',
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_REMOVED = 'room_removed',
  TURN_ENDED = 'turn_ended',
}

export type TAnalyticsEventProperties = {
  [EAnalyticsEvent.ABILITY_PLAYED]: { abilityId: TAbilityId; game: EGame };
  [EAnalyticsEvent.CARD_BOUGHT_COMPANION]: { game: EGame };
  [EAnalyticsEvent.CARD_BOUGHT_DARKNESS_MADNESS]: { game: EGame };
  [EAnalyticsEvent.CARD_BOUGHT_HARBINGER]: { game: EGame };
  [EAnalyticsEvent.CARD_BOUGHT_MARKET]: { cardId: ECardId; game: EGame };
  [EAnalyticsEvent.CARD_PLAYED]: { cardId: ECardId; game: EGame };
  [EAnalyticsEvent.GAME_ENDED]: { durationMs: number; game: EGame; playerCount: number; roomId: string };
  [EAnalyticsEvent.GAME_STARTED]: { game: EGame; playerCount: number; roomId: string };
  [EAnalyticsEvent.MESSAGE_SENT]: { game: EGame };
  [EAnalyticsEvent.MODAL_RESPONDED]: {
    closed: boolean;
    game: EGame;
    modalType: EModalTypes;
    selectedCardIds?: ECardId[];
    selectedShardIds?: TStoneShardId[];
    selectedVariantId?: number | string;
  };
  [EAnalyticsEvent.MODAL_SHOWN]: {
    cardAttackId?: ECardId;
    cardsCount?: number;
    game: EGame;
    modalType: EModalTypes;
    title?: string;
    variants?: string[];
  };
  [EAnalyticsEvent.PLAYER_READY_TOGGLED]: { game: EGame };
  [EAnalyticsEvent.PLAYER_REMOVED]: { game: EGame; roomId: string };
  [EAnalyticsEvent.ROOM_CREATED]: { game: EGame; roomId: string };
  [EAnalyticsEvent.ROOM_JOINED]: { game: EGame; isViewer: boolean; roomId: string };
  [EAnalyticsEvent.ROOM_LEFT]: { game: EGame; roomId: string };
  [EAnalyticsEvent.ROOM_REMOVED]: { game: EGame; reason: 'admin' | 'empty'; roomId: string };
  [EAnalyticsEvent.TURN_ENDED]: { game: EGame; roomId: string };
};
