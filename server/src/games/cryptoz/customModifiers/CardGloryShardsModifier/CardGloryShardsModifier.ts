import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TCardGloryShardsModifier } from './types';

export class CardGloryShardsModifier extends AbstractModifier<TCardGloryShardsModifier> {
  private readonly modifierType = 'cardGloryShards';

  constructor(id: string, modifier: TCardGloryShardsModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
