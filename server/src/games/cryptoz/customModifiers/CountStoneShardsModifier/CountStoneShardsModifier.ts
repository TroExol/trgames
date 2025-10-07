import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TCountStoneShardsModifier } from './types';

export class CountStoneShardsModifier extends AbstractModifier<TCountStoneShardsModifier> {
  private readonly modifierType = 'countStoneShards';

  constructor(id: string, modifier: TCountStoneShardsModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
