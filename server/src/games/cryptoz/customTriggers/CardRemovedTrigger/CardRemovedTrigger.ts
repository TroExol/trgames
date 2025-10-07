import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TCardRemovedTrigger } from './types';

export class CardRemovedTrigger extends AbstractTrigger<TCardRemovedTrigger> {
  private readonly triggerType = 'cardRemoved';

  constructor(id: string, trigger: TCardRemovedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
