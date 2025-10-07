import _ from 'lodash';

import type { AbstractTrigger } from '../AbstractTrigger';

export class TriggerGroup<T extends AbstractTrigger> {
  public array: T[] = [];

  constructor(triggers?: T[]) {
    if (triggers) {
      this.array = triggers;
      this.array.sort((a, b) => a.order - b.order);
    }
  }

  public addTrigger = (trigger: T): void => {
    const index = _.sortedLastIndexBy(this.array, trigger, 'order');
    this.array.splice(index, 0, trigger);
  };

  public removeTrigger = (trigger: T): boolean => {
    if (this.getTrigger(trigger)) {
      this.array = this.array.filter(t => t !== trigger);
      return true;
    }
    return false;
  };

  public removeTriggerById = (id: string): boolean => {
    return Boolean(_.remove(this.array, ['id', id]).length);
  };

  public getTrigger = (trigger: T): T | null => {
    return this.array.find(m => m === trigger) ?? null;
  };

  public getTriggerById = (id: string): T | null => {
    return _.find(this.array, ['id', id]) ?? null;
  };

  public apply = (...params: Parameters<T['trigger']>): void => {
    [...this.array].forEach(trigger => {
      trigger.apply(...params);
    });
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
