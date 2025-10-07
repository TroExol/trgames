import type { TTrigger } from './types';

export abstract class AbstractTrigger<T extends TTrigger = TTrigger> {
  public readonly id: string;
  public readonly trigger: T;
  // В каком порядке применять модификатор, чем меньше, тем раньше выполняется
  // 0 для самых первых модификаторов, 9999 - для самых последних
  public readonly order: number;

  protected constructor(id: string, trigger: T, { order = 1 } = {}) {
    this.id = id;
    this.trigger = trigger;
    this.order = order;
  }

  public apply(...params: Parameters<T>): void {
    this.trigger(...params);
  }
}
