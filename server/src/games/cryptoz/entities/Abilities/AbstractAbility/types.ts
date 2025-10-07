import type { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

export interface TAbilityConstructorParams {
  room?: Room;
  id: CryptozShared.TAbilityId;
}
