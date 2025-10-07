import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TTurnStartedTrigger } from './types';

export class TurnStartedTrigger extends AbstractTrigger<TTurnStartedTrigger> {
  private readonly triggerType = 'turnStarted';

  constructor(id: string, trigger: TTurnStartedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
