import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Ability8 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability8';
import { Ability7 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability7';
import { Ability6 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability6';
import { Ability5 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability5';
import { Ability4 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability4';
import { Ability3 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability3';
import { Ability2 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability2';
import { Ability1 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability1';

import { AbilityGroup, EAbilityGroupType } from './AbilityGroup';

export const getInitialAbilityMasterDeck = (room?: Room): AbilityGroup<EAbilityGroupType.MASTER_DECK> => {
  const abilities = new AbilityGroup(EAbilityGroupType.MASTER_DECK);
  const ability1 = new Ability1(room);
  abilities.addAbilityToBottom(ability1);
  const ability2 = new Ability2(room);
  abilities.addAbilityToBottom(ability2);
  const ability3 = new Ability3(room);
  abilities.addAbilityToBottom(ability3);
  const ability4 = new Ability4(room);
  abilities.addAbilityToBottom(ability4);
  const ability5 = new Ability5(room);
  abilities.addAbilityToBottom(ability5);
  const ability6 = new Ability6(room);
  abilities.addAbilityToBottom(ability6);
  const ability7 = new Ability7(room);
  abilities.addAbilityToBottom(ability7);
  const ability8 = new Ability8(room);
  abilities.addAbilityToBottom(ability8);
  abilities.shuffle();
  return abilities;
};
