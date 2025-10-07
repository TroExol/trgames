import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TDamageTookTrigger } from './types';

export class DamageTookTrigger extends AbstractTrigger<TDamageTookTrigger> {
  private readonly triggerType = 'damageTook';

  constructor(id: string, trigger: TDamageTookTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
