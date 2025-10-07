import type { CryptozShared } from '@trgames/shared';

export interface TSelectStartCardsProps {
  companions: CryptozShared.TCard[];
  abilities: CryptozShared.TAbility[];
  onSubmit: (companion: CryptozShared.TCard, ability: CryptozShared.TAbility) => void;
}
