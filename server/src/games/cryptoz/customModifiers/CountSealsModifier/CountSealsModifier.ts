import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TCountSealsModifier } from './types';

export class CountSealsModifier extends AbstractModifier<TCountSealsModifier> {
  private readonly modifierType = 'countSeals';

  constructor(id: string, modifier: TCountSealsModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
