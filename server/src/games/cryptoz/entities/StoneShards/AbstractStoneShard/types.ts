import type { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

export interface TStoneShardConstructorParams {
  room?: Room;
  id: CryptozShared.TStoneShardId;
}
