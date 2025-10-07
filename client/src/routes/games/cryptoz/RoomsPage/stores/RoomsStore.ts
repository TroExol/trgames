import type { CryptozShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';
import find from 'lodash/find';

export class RoomsStore {
  public rooms: CryptozShared.TRoomShort[] = [];
  public filters = {
    name: '',
    isWithoutPassword: false,
    isGameNotStarted: false,
  };
  public selectedRoomUuid?: string;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public setSelectedRoom = (uuid: string): void => {
    this.selectedRoomUuid = uuid;
  };

  public setNameFilter = (name: string): void => {
    this.filters.name = name;
  };

  public toggleIsWithoutPassword = (): void => {
    this.filters.isWithoutPassword = !this.filters.isWithoutPassword;
  };

  public toggleIsGameNotStarted = (): void => {
    this.filters.isGameNotStarted = !this.filters.isGameNotStarted;
  };

  public updateRooms = (rooms: CryptozShared.TRoomShort[]): void => {
    this.rooms = rooms;
  };

  public clear = (): void => {
    this.rooms = [];
    this.filters = {
      name: '',
      isWithoutPassword: false,
      isGameNotStarted: false,
    };
    this.selectedRoomUuid = undefined;
  };

  public get filteredRooms(): CryptozShared.TRoomShort[] {
    return this.rooms.filter(({ name, isWithPassword, isGameStarted }) => {
      return name.toLowerCase().includes(this.filters.name.toLowerCase())
        && (!this.filters.isWithoutPassword || !isWithPassword)
        && (!this.filters.isGameNotStarted || !isGameStarted);
    });
  }

  public get currentRoom(): CryptozShared.TRoomShort | undefined {
    return this.selectedRoomUuid
      ? find(this.rooms, ['uuid', this.selectedRoomUuid])
      : undefined;
  }
}
