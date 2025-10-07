import type { AbstractAbility } from '@/games/cryptoz/entities/Abilities/AbstractAbility';
import type { AbilityGroup, EAbilityGroupType } from '@/games/cryptoz/entities/Abilities/AbilityGroup';

export type TAbilityTookTrigger = (
  ability: AbstractAbility,
  from: AbilityGroup<EAbilityGroupType.ANY>,
  prevOwnerNickname: string | undefined,
) => void;
