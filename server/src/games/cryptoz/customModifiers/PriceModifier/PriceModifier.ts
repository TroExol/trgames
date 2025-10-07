import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TPriceModifier } from './types';

export class PriceModifier extends AbstractModifier<TPriceModifier> {
  private readonly modifierType = 'price';

  constructor(id: string, modifier: TPriceModifier, { order = 0 } = {}) {
    super(
      id,
      (currentValue: number, card: AbstractCard) => {
        const result = modifier(currentValue, card);
        return result >= 0
          ? result
          : 0;
      },
      { order },
    );
  }
}
