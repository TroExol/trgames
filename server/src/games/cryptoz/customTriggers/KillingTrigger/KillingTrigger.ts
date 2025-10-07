import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TKillingTrigger } from './types';

// Триггер, когда участник убивает кого-то
export class KillingTrigger extends AbstractTrigger<TKillingTrigger> {
  private readonly triggerType = 'killing';

  constructor(id: string, trigger: TKillingTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
