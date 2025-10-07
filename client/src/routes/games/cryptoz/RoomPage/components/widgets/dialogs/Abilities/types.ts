import type { CryptozShared } from '@trgames/shared';

export interface TAbilitiesProps {
  abilities: CryptozShared.TAbility[];
  countAbilitiesToSelect?: number;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, abilities: CryptozShared.TAbility[]) => void;
}
