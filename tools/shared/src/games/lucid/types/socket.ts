import type { TPartyView } from './view';
import type { TMove } from './move';

export enum ELucidEvent {
  appendRibbon = 'append-ribbon',
  declineTheme = 'decline-theme',
  makeMove = 'make-move',
  playAgain = 'play-again',
  proposeTheme = 'propose-theme',
  showError = 'show-error',
  startParty = 'start-party',
  updateParty = 'update-party',
}

export interface TLucidServerToClientEvents {
  // Одно сообщение на все фазы: клиент рисует то, что прислали, и ничего
  // не достраивает сам
  [ELucidEvent.updateParty]: (view: TPartyView) => void;
  // Только прирост ленты, а не журнал целиком
  [ELucidEvent.appendRibbon]: (lines: string[]) => void;
  [ELucidEvent.showError]: (params: { message: string }) => void;
}

export interface TLucidClientToServerEvents {
  [ELucidEvent.proposeTheme]: (theme: string) => void;
  [ELucidEvent.declineTheme]: () => void;
  [ELucidEvent.startParty]: () => void;
  [ELucidEvent.makeMove]: (move: TMove) => void;
  [ELucidEvent.playAgain]: () => void;
}
