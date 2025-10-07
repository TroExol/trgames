import type { Namespace, Socket } from 'socket.io';
import type { CryptozShared } from '@trgames/shared';

import type { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import type { Player } from '@/games/cryptoz/entities/Players/Player';
import type { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';
import type { AbstractAbility } from '@/games/cryptoz/entities/Abilities/AbstractAbility';
import type { AbilityGroup, EAbilityGroupType } from '@/games/cryptoz/entities/Abilities/AbilityGroup';

export type TNamespace = Namespace<CryptozShared.TClientToServerEvents, CryptozShared.TServerToClientEvents>;

export type TSocket = Socket<CryptozShared.TClientToServerEvents, CryptozShared.TServerToClientEvents>;

export interface TSocketsServiceConstructorParams {
  room: Room;
  nsp: TNamespace;
}

export interface TSelectCardsParams<T extends string | number = string> {
  player: Player;
  cards: CardGroup<ECardGroupType.ANY>;
  variants: CryptozShared.TVariant<T>[];
  cardsSubtitle?: { [cardReadableId: string]: string };
  count?: number | null;
  title?: string;
  canClose?: boolean;
}

export interface TSelectCardsResult<T extends string | number = string | number> {
  cards: CardGroup<ECardGroupType.ANY>;
  variant?: CryptozShared.TVariant<T>['id'];
}

export interface TSelectEvadeCardParams {
  player: Player;
  cards: CardGroup<ECardGroupType.ANY>;
  cardAttack: AbstractCard;
  cardsToShow?: CardGroup<ECardGroupType.ANY>;
  title?: string;
  canClose?: boolean;
}

export interface TShowCardsParams {
  players: PlayerGroup;
  cards: CardGroup<ECardGroupType.ANY>;
  title?: string;
  cardsSubtitle?: { [cardReadableId: string]: string };
}

export interface TSelectStoneShardsParams {
  player: Player;
  stoneShards: StoneShardGroup<EStoneShardGroupType.ANY>;
  variants: CryptozShared.TVariant<string | number>[];
  count?: number;
  title?: string;
  canClose?: boolean;
}

export interface TSelectStoneShardsResult {
  stoneShards: StoneShardGroup<EStoneShardGroupType.ANY>;
  variant?: CryptozShared.TVariant<string | number>['id'];
}

export interface TSelectTargetParams {
  player: Player;
  targetsToSelect?: PlayerGroup;
  title?: string;
  canClose?: boolean;
}

export interface TSelectVariantParams<T extends string | number> {
  player: Player;
  variants: CryptozShared.TVariant<T>[];
  title?: string;
  canClose?: boolean;
}

export type TSelectVariantResult<T extends CryptozShared.TVariant<string | number>['id']> = T | null;

export interface TSelectAbilityAndCompanionParams {
  player: Player;
  companions: CardGroup<ECardGroupType.ANY>;
  abilities: AbilityGroup<EAbilityGroupType.ANY>;
}

export interface TSelectAbilityAndCompanionResult {
  companion: AbstractCard;
  ability: AbstractAbility;
}
