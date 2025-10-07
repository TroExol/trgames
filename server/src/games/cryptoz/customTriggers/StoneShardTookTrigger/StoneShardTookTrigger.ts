import { AbstractTrigger } from '@/helpers/Triggers/AbstractTrigger';

import type { TStoneShardTookTrigger } from './types';

export class StoneShardTookTrigger extends AbstractTrigger<TStoneShardTookTrigger> {
  private readonly triggerType = 'stoneShardTook';

  constructor(id: string, trigger: TStoneShardTookTrigger, { order = 0 } = {}) {
    super(id, trigger, { order });
  }
}
