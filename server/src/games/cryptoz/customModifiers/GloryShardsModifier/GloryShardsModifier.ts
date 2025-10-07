import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TGloryShardsModifier } from './types';

export class GloryShardsModifier extends AbstractModifier<TGloryShardsModifier> {
  private readonly modifierType = 'gloryShards';

  constructor(id: string, modifier: TGloryShardsModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
