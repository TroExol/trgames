import type { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import type { AbstractStoneShard } from '@/games/cryptoz/entities/StoneShards/AbstractStoneShard';

export type TStoneShardTookTrigger = (
  stoneShard: AbstractStoneShard,
  from: StoneShardGroup<EStoneShardGroupType.ANY>,
  prevOwnerNickname: string | undefined,
) => void;
