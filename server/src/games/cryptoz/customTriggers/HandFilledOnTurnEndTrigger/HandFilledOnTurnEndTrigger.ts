import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { THandFilledOnTurnEndTrigger } from './types';

export class HandFilledOnTurnEndTrigger extends AbstractTrigger<THandFilledOnTurnEndTrigger> {
  private readonly triggerType = 'handFilledOnTurnEnd';

  constructor(id: string, trigger: THandFilledOnTurnEndTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
