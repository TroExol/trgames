import type { TRoom } from './room';
import type { TPlayer } from './player';
import type {
  EModalTypes,
  TModalParams,
  TModalResponse,
} from './modal';
import type { TMessage } from './message';
import type { TLog } from './log';
import type { TCard } from './card';
import type { TAbility } from './ability';

export enum EEventTypes {
  buyCompanionCard = 'buy-companion-card',
  buyDarknessMadnessCard = 'buy-darkness-madness-card',
  buyHarbingerCard = 'buy-harbinger-card',
  buyMarketCard = 'buy-market-card',
  endTurn = 'end-turn',
  playAbility = 'play-ability',
  playCard = 'play-card',
  removePlayer = 'remove-player',
  removeRoom = 'remove-room',
  sendLogs = 'send-logs',
  sendMessage = 'send-message',
  sendMessages = 'send-messages',
  showModalCards = 'show-cards',
  showModalEndGame = 'show-end-game',

  showModalLeftUniqueCardTypes = 'show-left-unique-card-types',
  showModalSelectCards = 'show-select-cards',
  showModalSelectStartCards = 'show-select-start-cards',
  showModalSelectStoneShards = 'show-select-stone-shards',
  showModalSelectVariant = 'show-select-variant',
  showModalSuggestEvade = 'show-suggest-evade',
  showToast = 'show-toast',
  toggleReady = 'toggle-ready',

  updateRoom = 'update-room',
}

export interface TServerToClientWithAckEvents {
  [EEventTypes.showModalSelectStartCards]: (
    params: TModalParams<EModalTypes.selectStartCards>,
    callback: (params: TModalResponse<EModalTypes.selectStartCards>) => void
  ) => void;
  [EEventTypes.showModalSelectCards]: (
    params: TModalParams<EModalTypes.selectCards>,
    callback: (params: TModalResponse<EModalTypes.selectCards>) => void
  ) => void;
  [EEventTypes.showModalSuggestEvade]: (
    params: TModalParams<EModalTypes.suggestEvade>,
    callback: (params: TModalResponse<EModalTypes.suggestEvade>) => void
  ) => void;
  [EEventTypes.showModalSelectStoneShards]: (
    params: TModalParams<EModalTypes.selectStoneShards>,
    callback: (params: TModalResponse<EModalTypes.selectStoneShards>) => void
  ) => void;
  [EEventTypes.showModalSelectVariant]: (
    params: TModalParams<EModalTypes.selectVariant>,
    callback: (params: TModalResponse<EModalTypes.selectVariant>) => void
  ) => void;
}

export interface TServerToClientWithoutAckEvents {
  [EEventTypes.updateRoom]: (room: TRoom) => void;
  [EEventTypes.sendLogs]: (logs: TLog[]) => void;
  [EEventTypes.sendMessages]: (messages: TMessage[]) => void;
  [EEventTypes.showModalEndGame]: (params: TModalParams<EModalTypes.endGame>) => void;
  [EEventTypes.showModalCards]: (params: TModalParams<EModalTypes.cards>) => void;
  [EEventTypes.showToast]: (params: { message: string }) => void;
}

export type TServerToClientEvents = TServerToClientWithAckEvents & TServerToClientWithoutAckEvents;

export interface TClientToServerEvents {
  [EEventTypes.removePlayer]: (nickname: string) => void;
  [EEventTypes.buyMarketCard]: (card: TCard) => void;
  [EEventTypes.playCard]: ({ card, target }: { card: TCard; target?: TPlayer }) => void;
  [EEventTypes.playAbility]: (ability: TAbility) => void;
  [EEventTypes.sendMessage]: (message: string) => void;
  [EEventTypes.buyHarbingerCard]: () => void;
  [EEventTypes.buyDarknessMadnessCard]: () => void;
  [EEventTypes.buyCompanionCard]: () => void;
  [EEventTypes.endTurn]: () => void;
  [EEventTypes.removeRoom]: () => void;
  [EEventTypes.toggleReady]: () => void;
}
