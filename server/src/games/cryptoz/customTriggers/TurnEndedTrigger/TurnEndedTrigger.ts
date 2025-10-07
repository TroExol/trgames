import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TTurnEndedTrigger } from './types';

export class TurnEndedTrigger extends AbstractTrigger<TTurnEndedTrigger> {
  private readonly triggerType = 'turnEnded';

  constructor(id: string, trigger: TTurnEndedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
