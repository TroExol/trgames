import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TEssenceModifier } from './types';

export class EssenceModifier extends AbstractModifier<TEssenceModifier> {
  private readonly modifierType = 'essence';

  constructor(id: string, modifier: TEssenceModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
