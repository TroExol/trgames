import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TCardDiscardedTrigger } from './types';

export class CardDiscardedTrigger extends AbstractTrigger<TCardDiscardedTrigger> {
  private readonly triggerType = 'cardDiscarded';

  constructor(id: string, trigger: TCardDiscardedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
