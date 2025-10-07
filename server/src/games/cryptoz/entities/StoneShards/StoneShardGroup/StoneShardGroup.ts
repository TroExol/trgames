import type { CryptozShared } from '@trgames/shared';

import _ from 'lodash';

import type { AbstractStoneShard } from '../AbstractStoneShard';

import { EStoneShardGroupType } from './types';

export class StoneShardGroup<T extends EStoneShardGroupType> {
  public array: AbstractStoneShard[] = [];
  private readonly type: EStoneShardGroupType;

  constructor(type: T, stoneShards?: AbstractStoneShard[]) {
    this.type = type;
    if (stoneShards) {
      this.array = stoneShards;
    }
  }

  public clone = (): StoneShardGroup<T> => {
    return new StoneShardGroup(this.type, [...this.array]);
  };

  public shuffle(): void {
    this.array = _.shuffle(this.array);
  }

  public toShuffle(): StoneShardGroup<T> {
    return new StoneShardGroup(this.type, _.shuffle([...this.array]));
  }

  public getStoneShard = (stoneShard: AbstractStoneShard): AbstractStoneShard | null => {
    return _.find(this.array, stoneShard) ?? null;
  };

  public getStoneShardById = (id: CryptozShared.TStoneShardId): AbstractStoneShard | null => {
    return _.find(this.array, ['id', id]) ?? null;
  };

  public getStoneShardsFromTop = (count: number): StoneShardGroup<EStoneShardGroupType.ANY> => {
    if (count <= 0) {
      return new StoneShardGroup(EStoneShardGroupType.ANY, []);
    }
    return new StoneShardGroup(EStoneShardGroupType.ANY, this.array.slice(-count));
  };

  public getStoneShardsFromBottom = (count: number): StoneShardGroup<EStoneShardGroupType.ANY> => {
    if (count <= 0) {
      return new StoneShardGroup(EStoneShardGroupType.ANY, []);
    }
    return new StoneShardGroup(EStoneShardGroupType.ANY, this.array.slice(0, count));
  };

  public getStoneShardsById = (id: CryptozShared.TStoneShardId): StoneShardGroup<EStoneShardGroupType.ANY> => {
    return new StoneShardGroup(EStoneShardGroupType.ANY, _.filter(this.array, ['id', id]));
  };

  public getStoneShardByUuid = (uuid: string): AbstractStoneShard | null => {
    return _.find(this.array, ['uuid', uuid]) ?? null;
  };

  public getCountStoneShardsById = (id: CryptozShared.TStoneShardId): number => {
    return this.getStoneShardsById(id).count;
  };

  public addStoneShardToBottom = (stoneShard: AbstractStoneShard): void => {
    this.array.unshift(stoneShard);
  };

  public addStoneShardToTop = (stoneShard: AbstractStoneShard): void => {
    this.array.push(stoneShard);
  };

  public removeStoneShard = (stoneShard: AbstractStoneShard): AbstractStoneShard | null => {
    return _.remove(this.array, stoneShard)[0] ?? null;
  };

  public removeStoneShardsById = (id: CryptozShared.TStoneShardId): StoneShardGroup<EStoneShardGroupType.ANY> => {
    return new StoneShardGroup(EStoneShardGroupType.ANY, _.remove(this.array, ['id', id]));
  };

  public removeStoneShardsFromTop = (count: number): StoneShardGroup<EStoneShardGroupType.ANY> => {
    if (count <= 0) {
      return new StoneShardGroup(EStoneShardGroupType.ANY, []);
    }
    return new StoneShardGroup(EStoneShardGroupType.ANY, this.array.splice(-count));
  };

  public removeStoneShardsFromBottom = (count: number): StoneShardGroup<EStoneShardGroupType.ANY> => {
    if (count <= 0) {
      return new StoneShardGroup(EStoneShardGroupType.ANY, []);
    }
    return new StoneShardGroup(EStoneShardGroupType.ANY, this.array.splice(0, count));
  };

  public getStoneShardsExceptStoneShard = (stoneShard: AbstractStoneShard):
  StoneShardGroup<EStoneShardGroupType.ANY> => {
    return new StoneShardGroup(EStoneShardGroupType.ANY, _.without(this.array, stoneShard));
  };

  public clear = (): void => {
    this.array = [];
  };

  public get randomStoneShard(): AbstractStoneShard | null {
    return _.sample(this.array) ?? null;
  };

  public get ids(): CryptozShared.TStoneShardId[] {
    return _.map(this.array, 'id');
  }

  public get count(): number {
    return this.array.length;
  }

  public get top(): AbstractStoneShard | null {
    return _.last(this.array) ?? null;
  }

  public get bottom(): AbstractStoneShard | null {
    return _.first(this.array) ?? null;
  }
}
