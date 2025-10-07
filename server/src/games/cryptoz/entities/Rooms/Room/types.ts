import type { CryptozShared } from '@trgames/shared';

import type { TNamespace } from '@/games/cryptoz/services/SocketsService';

import type { PlayerGroup } from '../../Players/PlayerGroup';
import type { Player } from '../../Players/Player';

export interface TRoomConstructorParams {
  uuid: string;
  name: string;
  nsp: TNamespace;
  settings: CryptozShared.TRoomSettings;
}

export interface TPlayChaosAdditionalParams {
  tempPlayer?: Player;
  concreteTargets?: PlayerGroup;
}
