import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TCardTookTrigger } from './types';

export class CardTookTrigger extends AbstractTrigger<TCardTookTrigger> {
  private readonly triggerType = 'cardTook';

  constructor(id: string, trigger: TCardTookTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
