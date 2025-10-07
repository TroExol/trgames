import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import { AbstractModifier } from '@/helpers/Modifiers/AbstractModifier';

import type { TDamageModifier } from './types';

export class DamageModifier extends AbstractModifier<TDamageModifier> {
  private readonly modifierType = 'damage';

  constructor(id: string, modifier: TDamageModifier, { order = 0 } = {}) {
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
