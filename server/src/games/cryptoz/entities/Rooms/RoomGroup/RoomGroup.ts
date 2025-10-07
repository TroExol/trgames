import type { Room } from '../Room';

export class RoomGroup {
  private readonly map = new Map<string, Room>();

  public getRoom = (room: Room): Room | null => {
    return this.rooms.find(s => s === room) ?? null;
  };

  public getRoomByUuid = (uuid: string): Room | null => {
    return this.map.get(uuid) ?? null;
  };

  public addRoom = (room: Room): void => {
    this.map.set(room.uuid, room);
  };

  public removeRoom = (room: Room): boolean => {
    if (this.getRoomByUuid(room.uuid)) {
      this.map.delete(room.uuid);
      return true;
    }
    return false;
  };

  public removeRoomByUuid = (uuid: string): boolean => {
    if (this.getRoomByUuid(uuid)) {
      this.map.delete(uuid);
      return true;
    }
    return false;
  };

  public clear = (): void => {
    this.map.clear();
  };

  public get count(): number {
    return this.map.size;
  }

  public get entries(): [string, Room][] {
    return [...this.map.entries()];
  }

  public get rooms(): Room[] {
    return [...this.map.values()];
  }

  public get uuids(): string[] {
    return [...this.map.keys()];
  }
}
