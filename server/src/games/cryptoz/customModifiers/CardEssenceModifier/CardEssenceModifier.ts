import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TCardEssenceModifier } from './types';

export class CardEssenceModifier extends AbstractModifier<TCardEssenceModifier> {
  private readonly modifierType = 'cardEssence';

  constructor(id: string, modifier: TCardEssenceModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
