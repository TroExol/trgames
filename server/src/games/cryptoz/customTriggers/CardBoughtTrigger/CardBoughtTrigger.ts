import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TCardBoughtTrigger } from './types';

export class CardBoughtTrigger extends AbstractTrigger<TCardBoughtTrigger> {
  private readonly triggerType = 'cardBought';

  constructor(id: string, trigger: TCardBoughtTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
