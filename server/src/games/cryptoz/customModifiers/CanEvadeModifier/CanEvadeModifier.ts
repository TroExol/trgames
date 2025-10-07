import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TCanEvadeModifier } from './types';

export class CanEvadeModifier extends AbstractModifier<TCanEvadeModifier> {
  private readonly modifierType = 'canEvade';

  constructor(id: string, modifier: TCanEvadeModifier, { order = 0 } = {}) {
    super(id, modifier, { order });
  }
}
