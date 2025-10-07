import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TCardPlayedTrigger } from './types';

export class CardPlayedTrigger extends AbstractTrigger<TCardPlayedTrigger> {
  private readonly triggerType = 'cardPlayed';

  constructor(id: string, trigger: TCardPlayedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
