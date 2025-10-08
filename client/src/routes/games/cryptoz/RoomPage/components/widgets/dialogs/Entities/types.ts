import type { CryptozShared } from '@trgames/shared';

export interface TEntitiesProps {
  cards?: CryptozShared.TCard[];
  cardsSubtitle?: { [cardReadableId: string]: string };
  abilities?: CryptozShared.TAbility[];
  stoneShards?: CryptozShared.TStoneShard[];
}
