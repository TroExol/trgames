import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TAbilityTookTrigger } from './types';

export class AbilityTookTrigger extends AbstractTrigger<TAbilityTookTrigger> {
  private readonly triggerType = 'abilityTook';

  constructor(id: string, trigger: TAbilityTookTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
