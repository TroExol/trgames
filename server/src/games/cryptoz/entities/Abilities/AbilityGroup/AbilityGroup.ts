import type { CryptozShared } from '@trgames/shared';

import _ from 'lodash';

import type { AbstractAbility } from '../AbstractAbility';

import { EAbilityGroupType } from './types';

export class AbilityGroup<T extends EAbilityGroupType> {
  public array: AbstractAbility[] = [];
  private readonly type: EAbilityGroupType;

  constructor(type: T, abilities?: AbstractAbility[]) {
    this.type = type;
    if (abilities) {
      this.array = abilities;
    }
  }

  public clone(): AbilityGroup<T> {
    return new AbilityGroup(this.type, [...this.array]);
  }

  public shuffle(): void {
    this.array = _.shuffle(this.array);
  }

  public toShuffle(): AbilityGroup<T> {
    return new AbilityGroup(this.type, _.shuffle([...this.array]));
  }

  public getAbility = (ability: AbstractAbility): AbstractAbility | null => {
    return _.find(this.array, ability) ?? null;
  };

  public getAbilityById = (id: CryptozShared.TAbilityId): AbstractAbility | null => {
    return _.find(this.array, ['id', id]) ?? null;
  };

  public getAbilityByUuid = (uuid: string): AbstractAbility | null => {
    return _.find(this.array, ['uuid', uuid]) ?? null;
  };

  public getAbilitiesById = (id: CryptozShared.TAbilityId): AbilityGroup<EAbilityGroupType.ANY> => {
    return new AbilityGroup(EAbilityGroupType.ANY, _.filter(this.array, ['id', id]));
  };

  public getCountAbilitiesById = (id: CryptozShared.TAbilityId): number => {
    return this.getAbilitiesById(id).count;
  };

  public addAbilityToBottom = (ability: AbstractAbility): void => {
    this.array.unshift(ability);
  };

  public addAbilityToTop = (ability: AbstractAbility): void => {
    this.array.push(ability);
  };

  public removeAbility = (ability: AbstractAbility): AbstractAbility | null => {
    return _.remove(this.array, ability)[0] ?? null;
  };

  public removeAbilitiesById = (id: CryptozShared.TAbilityId): AbilityGroup<EAbilityGroupType.ANY> => {
    return new AbilityGroup(EAbilityGroupType.ANY, _.remove(this.array, ['id', id]));
  };

  public removeAbilitiesFromTop = (count: number): AbilityGroup<EAbilityGroupType.ANY> => {
    if (count <= 0) {
      return new AbilityGroup(EAbilityGroupType.ANY, []);
    }
    return new AbilityGroup(EAbilityGroupType.ANY, this.array.splice(-count));
  };

  public removeAbilitiesFromBottom = (count: number): AbilityGroup<EAbilityGroupType.ANY> => {
    if (count <= 0) {
      return new AbilityGroup(EAbilityGroupType.ANY, []);
    }
    return new AbilityGroup(EAbilityGroupType.ANY, this.array.splice(0, count));
  };

  public getAbilitiesExceptAbility = (ability: AbstractAbility): AbilityGroup<EAbilityGroupType.ANY> => {
    return new AbilityGroup(EAbilityGroupType.ANY, _.without(this.array, ability));
  };

  public clear = (): void => {
    this.array = [];
  };

  public get top(): AbstractAbility | null {
    return _.last(this.array) ?? null;
  }

  public get bottom(): AbstractAbility | null {
    return _.first(this.array) ?? null;
  }

  public get randomAbility(): AbstractAbility | null {
    return _.sample(this.array) ?? null;
  };

  public get ids(): CryptozShared.TAbilityId[] {
    return this.array.map(c => c.id);
  }

  public get count(): number {
    return this.array.length;
  }
}
