import _ from 'lodash';

import type { AbstractModifier } from '../AbstractModifier';

export class ModifierGroup<T extends AbstractModifier> {
  public array: T[] = [];

  constructor(modifiers?: T[]) {
    if (modifiers) {
      this.array = modifiers;
      this.array.sort((a, b) => a.order - b.order);
    }
  }

  public addModifier = (modifier: T): void => {
    const index = _.sortedLastIndexBy(this.array, modifier, 'order');
    this.array.splice(index, 0, modifier);
  };

  public removeModifier = (modifier: T): boolean => {
    if (this.getModifier(modifier)) {
      this.array = this.array.filter(m => m !== modifier);
      return true;
    }
    return false;
  };

  public removeModifierById = (id: string): boolean => {
    return Boolean(_.remove(this.array, ['id', id]).length);
  };

  public getModifier = (modifier: T): T | null => {
    return this.array.find(m => m === modifier) ?? null;
  };

  public getModifierById = (id: string): T | null => {
    return _.find(this.array, ['id', id]) ?? null;
  };

  public apply = (...params: Parameters<T['modifier']>): ReturnType<T['modifier']> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.array.reduce<ReturnType<T['modifier']>>((acc, modifier) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
      return modifier.apply(acc, ..._.tail(params));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    }, params[0]);
  };

  public clear = (): void => {
    this.array = [];
  };

  public get ids(): string[] {
    return _.map(this.array, 'id');
  };

  public get count(): number {
    return this.array.length;
  };
}
