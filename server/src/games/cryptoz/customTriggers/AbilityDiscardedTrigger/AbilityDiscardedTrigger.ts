import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TAbilityDiscardedTrigger } from './types';

export class AbilityDiscardedTrigger extends AbstractTrigger<TAbilityDiscardedTrigger> {
  private readonly triggerType = 'abilityDiscarded';

  constructor(id: string, trigger: TAbilityDiscardedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
