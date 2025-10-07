import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TKilledTrigger } from './types';

// Триггер, когда участник умирает
export class KilledTrigger extends AbstractTrigger<TKilledTrigger> {
  private readonly triggerType = 'killed';

  constructor(id: string, trigger: TKilledTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
