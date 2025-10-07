import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { THealedTrigger } from './types';

export class HealedTrigger extends AbstractTrigger<THealedTrigger> {
  private readonly triggerType = 'healed';

  constructor(id: string, trigger: THealedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
