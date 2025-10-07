import _ from 'lodash';

import type { Player } from '../Player';

export class PlayerGroup {
  public array: Player[] = [];

  constructor(players?: Player[]) {
    if (players) {
      this.array = players;
    }
  }

  public clone = (): PlayerGroup => {
    return new PlayerGroup([...this.array]);
  };

  public getPlayer = (player: Player): Player | null => {
    return _.find(this.array, player) ?? null;
  };

  public getPlayerByNickname = (nickname: string): Player | null => {
    return _.find(this.array, ['nickname', nickname]) ?? null;
  };

  public addPlayerToBottom = (player: Player): void => {
    this.array.push(player);
  };

  public addPlayerToTop = (player: Player): void => {
    this.array.unshift(player);
  };

  public removePlayer = (player: Player): boolean => {
    return Boolean(_.remove(this.array, player).length);
  };

  public removePlayerByNickname = (nickname: string): boolean => {
    return Boolean(_.remove(this.array, ['nickname', nickname]).length);
  };

  public getPlayersExceptPlayer = (player: Player): PlayerGroup => {
    return new PlayerGroup(_.without(this.array, player));
  };

  public getLeftPlayer = (player: Player): Player | null => {
    return this.getPlayerByPos(player, 'left');
  };

  public getRightPlayer = (player: Player): Player | null => {
    return this.getPlayerByPos(player, 'right');
  };

  private readonly getPlayerByPos = (player: Player, pos: 'left' | 'right'): Player | null => {
    const players = [...this.array];
    if (players.length <= 1 || !this.getPlayer(player)) {
      return null;
    }

    const playerIndex = players.indexOf(player);
    let resPos: number;

    if (playerIndex === 0) {
      resPos = pos === 'right'
        ? players.length - 1
        : 1;
    } else if (playerIndex === players.length - 1) {
      resPos = pos === 'right'
        ? playerIndex - 1
        : 0;
    } else {
      resPos = pos === 'right'
        ? playerIndex - 1
        : playerIndex + 1;
    }

    return players[resPos];
  };

  public clear = (): void => {
    this.array = [];
  };

  public get minHpPlayers(): PlayerGroup {
    const players = this.array.reduce<Player[]>((acc, currentTarget) => {
      if (currentTarget.health === acc[0]?.health) {
        acc.push(currentTarget);
      } else if (!acc[0] || currentTarget.health < acc[0]?.health) {
        acc = [currentTarget];
      }
      return acc;
    }, []);
    return new PlayerGroup(players);
  }

  public get maxHpPlayers(): PlayerGroup {
    const players = this.array.reduce<Player[]>((acc, currentTarget) => {
      if (currentTarget.health === acc[0]?.health) {
        acc.push(currentTarget);
      } else if (!acc[0] || currentTarget.health > acc[0].health) {
        acc = [currentTarget];
      }
      return acc;
    }, []);
    return new PlayerGroup(players);
  }

  public get top(): Player | null {
    return this.array[0] ?? null;
  }

  public get bottom(): Player | null {
    return _.last(this.array) ?? null;
  }

  public get nicknames(): string[] {
    return _.map(this.array, 'nickname');
  }

  public get count(): number {
    return this.array.length;
  }
}
