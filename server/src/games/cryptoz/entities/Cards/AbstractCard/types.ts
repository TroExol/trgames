import type { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import type { AbstractCard } from './AbstractCard';

export interface TCardConstructorParams {
  room?: Room;
  id: CryptozShared.ECardId;
  target: CryptozShared.ECardTarget;
  type: CryptozShared.ECardType;
  name: string;
  price: number;
  baseEssence: number;
  gloryShards: number;
  isSeal: boolean;
  hasEvade: boolean;
}

export interface TCardPlayGeneralHandlerParams {
  concreteTarget?: Player;
  // Список участников для хаоса
  concreteTargets?: PlayerGroup;
  concreteDamage?: number;
  tempPlayer?: Player;
  // Всё, связанное с хаосом: карты хаоса, карты, разыгрываемые хаосом
  isForChaos?: boolean;
}

export interface TCardPlaySealHandlerParams {
  concreteTarget?: Player;
  concreteDamage?: number;
  tempPlayer?: Player;
  // Всё, связанное с хаосом: карты хаоса, карты, разыгрываемые хаосом
  isForChaos?: boolean;
}

export interface TCardPlayStrikeHandlerParams {
  concreteTarget?: Player;
  // Список участников для хаоса
  concreteTargets?: PlayerGroup;
  concreteDamage?: number;
  tempPlayer?: Player;
  // Всё, связанное с хаосом: карты хаоса, карты, разыгрываемые хаосом
  isForChaos?: boolean;
  canEvade?: boolean;
  // Отключает проверки, что можно разыграть мракобой
  force?: boolean;
}

export interface TCardPlayTotalDarknessStrikeHandlerParams {
  target?: Player;
}

export interface TCardEvadeHandlerParams {
  attacker?: Player;
  damage?: number;
  cardAttack: AbstractCard;
}
