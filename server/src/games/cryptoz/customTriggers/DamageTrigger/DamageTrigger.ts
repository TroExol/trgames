import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TDamageTrigger } from './types';

export class DamageTrigger extends AbstractTrigger<TDamageTrigger> {
  private readonly triggerType = 'damage';

  constructor(id: string, trigger: TDamageTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
