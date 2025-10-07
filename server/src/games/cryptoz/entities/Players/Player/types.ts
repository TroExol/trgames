import type { SocketsService } from '@/games/cryptoz/services/SocketsService';
import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import type { Player } from './Player';

export interface TPlayerConstructor {
  nickname: string;
  room: Room;
  participant: 'viewer' | 'player';
}

export interface TTryEvadeParams {
  attacker?: Player;
  title: string;
  cardAttack: AbstractCard;
  damage?: number;
  evadeCards?: CardGroup<ECardGroupType.ANY>;
  cardsToShow?: CardGroup<ECardGroupType.ANY>;
}

export type TSelectAbilityAndCompanionResponse =
  NonNullable<Awaited<ReturnType<typeof SocketsService.prototype.selectAbilityAndCompanion>>> | null;
