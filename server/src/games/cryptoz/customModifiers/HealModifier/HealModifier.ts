import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { THealModifier } from './types';

export class HealModifier extends AbstractModifier<THealModifier> {
  private readonly modifierType = 'heal';

  constructor(id: string, modifier: THealModifier, { order = 0 } = {}) {
    super(
      id,
      (currentValue: number) => {
        const result = modifier(currentValue);
        return result >= 0
          ? result
          : 0;
      },
      { order },
    );
  }
}
