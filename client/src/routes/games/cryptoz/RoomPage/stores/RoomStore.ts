import type { CryptozShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

const emptyRoom: CryptozShared.TRoom = {
  uuid: '',
  darknessCrown: {
    description: '',
    name: '',
    isPlaying: false,
  },
  activeChaos: undefined,
  activePlayerNickname: undefined,
  adminNickname: undefined,
  playerNickname: '',
  isGameEnded: false,
  endedAt: undefined,
  countHarbingers: 0,
  countViewers: 0,
  harbinger: undefined,
  name: '',
  isGameStarted: false,
  startedAt: undefined,
  countDeck: 0,
  players: [],
  abilities: [],
  removed: {
    cards: [],
    chaos: [],
  },
  market: [],
  stoneShards: [],
  darknessMadness: [],
  cursedSeal: [],
  pendingAckNicknames: [],
};

const compareBeforeAssign = <T extends keyof CryptozShared.TRoom>(
  room: CryptozShared.TRoom,
  target: T,
  newValue: CryptozShared.TRoom[T],
) => {
  if (!isEqual(room[target], newValue)) {
    room[target] = newValue;
  }
};

export class RoomStore {
  public room: CryptozShared.TRoom = cloneDeep(emptyRoom);
  public draggedHandCard: CryptozShared.TCard | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public clear = (): void => {
    this.room = cloneDeep(emptyRoom);
  };

  public updateRoom = (data: CryptozShared.TRoom): void => {
    this.room.uuid = data.uuid;
    this.room.activeChaos = data.activeChaos;
    this.room.activePlayerNickname = data.activePlayerNickname;
    this.room.adminNickname = data.adminNickname;
    this.room.isGameEnded = data.isGameEnded;
    this.room.name = data.name;
    this.room.playerNickname = data.playerNickname;
    this.room.endedAt = data.endedAt;
    this.room.countHarbingers = data.countHarbingers;
    this.room.countViewers = data.countViewers;
    this.room.countDeck = data.countDeck;
    this.room.harbinger = data.harbinger;
    this.room.isGameStarted = data.isGameStarted;
    this.room.startedAt = data.startedAt;

    compareBeforeAssign(this.room, 'darknessCrown', data.darknessCrown);
    compareBeforeAssign(this.room, 'market', data.market);
    compareBeforeAssign(this.room, 'harbinger', data.harbinger);
    compareBeforeAssign(this.room, 'players', data.players);
    compareBeforeAssign(this.room, 'abilities', data.abilities);
    compareBeforeAssign(this.room, 'stoneShards', data.stoneShards);
    compareBeforeAssign(this.room, 'darknessMadness', data.darknessMadness);
    compareBeforeAssign(this.room, 'cursedSeal', data.cursedSeal);
    compareBeforeAssign(this.room, 'removed', data.removed);
    compareBeforeAssign(this.room, 'pendingAckNicknames', data.pendingAckNicknames);
  };

  public setDraggedHandCard = (card: CryptozShared.TCard | null): void => {
    this.draggedHandCard = card;
  };

  public isActivePlayer = (playerOrNickname: CryptozShared.TPlayer | string): boolean => {
    return typeof playerOrNickname === 'string'
      ? playerOrNickname === this.room.activePlayerNickname
      : playerOrNickname.nickname === this.room.activePlayerNickname;
  };

  public isAdminPlayer = (playerOrNickname: CryptozShared.TPlayer | string): boolean => {
    return typeof playerOrNickname === 'string'
      ? playerOrNickname === this.room.adminNickname
      : playerOrNickname.nickname === this.room.adminNickname;
  };

  public isMe = (playerOrNickname: CryptozShared.TPlayer | string): boolean => {
    return typeof playerOrNickname === 'string'
      ? playerOrNickname === this.room.playerNickname
      : playerOrNickname.nickname === this.room.playerNickname;
  };

  public getPlayer = (playerOrNickname: CryptozShared.TPlayer | string): CryptozShared.TPlayer | undefined => {
    return this.room.players.find(p => typeof playerOrNickname === 'string'
      ? p.nickname === playerOrNickname
      : p === playerOrNickname);
  };

  get activePlayer(): CryptozShared.TPlayer | undefined {
    if (!this.room.activePlayerNickname) {
      return undefined;
    }
    return this.getPlayer(this.room.activePlayerNickname);
  }

  get me(): CryptozShared.TPlayer | undefined {
    return this.getPlayer(this.room.playerNickname);
  }

  get otherPlayers(): CryptozShared.TPlayer[] {
    return this.room.players.filter(p => p.nickname !== this.room.playerNickname);
  }
}
