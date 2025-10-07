import type { TModifier } from './types';

export abstract class AbstractModifier<T extends TModifier = TModifier> {
  public readonly id: string;
  public readonly modifier: T;
  // В каком порядке применять модификатор, чем меньше, тем раньше выполняется
  // 0 для самых первых модификаторов, 9999 - для самых последних
  public readonly order: number;

  protected constructor(id: string, modifier: T, { order = 1 } = {}) {
    this.id = id;
    this.modifier = modifier;
    this.order = order;
  }

  public apply = (...params: Parameters<T>): ReturnType<T> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.modifier(...params) as ReturnType<T>;
  };
}
