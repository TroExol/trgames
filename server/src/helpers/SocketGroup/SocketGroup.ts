import type { Socket } from 'socket.io';

export class SocketGroup<T extends Socket = Socket> {
  private readonly map = new Map<string, T>();

  public getSocket = (socket: T): T | null => {
    return this.sockets.find(s => s === socket) ?? null;
  };

  public getSocketByNickname = (nickname: string): T | null => {
    return this.map.get(nickname) ?? null;
  };

  public getNickname = (socket: T): string | null => {
    return this.entries.find(([, s]) => s === socket)?.[0] ?? null;
  };

  public addSocket = (nickname: string, socket: T): void => {
    this.map.set(nickname, socket);
  };

  public removeSocket = (socket: T): boolean => {
    const ownerNickname = this.getNickname(socket);
    if (ownerNickname) {
      this.map.delete(ownerNickname);
      return true;
    }
    return false;
  };

  public removeSocketByNickname = (nickname: string): boolean => {
    if (this.getSocketByNickname(nickname)) {
      this.map.delete(nickname);
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

  public get entries(): [string, T][] {
    return [...this.map.entries()];
  }

  public get sockets(): T[] {
    return [...this.map.values()];
  }

  public get nicknames(): string[] {
    return [...this.map.keys()];
  }
}
