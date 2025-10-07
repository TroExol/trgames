import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TStoneShardDiscardedTrigger } from './types';

export class StoneShardDiscardedTrigger extends AbstractTrigger<TStoneShardDiscardedTrigger> {
  private readonly triggerType = 'stoneShardDiscarded';

  constructor(id: string, trigger: TStoneShardDiscardedTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
