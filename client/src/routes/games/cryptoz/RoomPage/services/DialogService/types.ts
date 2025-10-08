import type { CryptozShared } from '@trgames/shared';

export interface TCardsDialog {
  title: string;
  cards: CryptozShared.TCard[];
  cardsSubtitle?: { [cardId: string]: string };
  countCardsToSelect?: number | null;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, cards: CryptozShared.TCard[]) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TAbilitiesDialog {
  title: string;
  abilities: CryptozShared.TAbility[];
  countAbilitiesToSelect?: number;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, abilities: CryptozShared.TAbility[]) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TEntitiesDialog {
  title: string;
  cards?: CryptozShared.TCard[];
  cardsSubtitle?: { [cardReadableId: string]: string };
  abilities?: CryptozShared.TAbility[];
  stoneShards?: CryptozShared.TStoneShard[];
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TPlayAbilityDialog {
  title: string;
  onSubmit: (ability: CryptozShared.TAbility) => void;
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TStoneShardsDialog {
  title: string;
  stoneShards: CryptozShared.TStoneShard[];
  countStoneShardsToSelect?: number;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, stoneShards: CryptozShared.TStoneShard[]) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TEndGameDialog {
  players: CryptozShared.TPlayer[];
}

export interface TSelectStartCardsDialog {
  companions: CryptozShared.TCard[];
  abilities: CryptozShared.TAbility[];
  onSubmit: (companion: CryptozShared.TCard, ability: CryptozShared.TAbility) => void;
}

export interface TSelectVariantDialog {
  title: string;
  variants: CryptozShared.TVariant<string | number>[];
  onSubmit: (id: string | number) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}

export interface TSuggestEvadeDialog {
  title: string;
  cards: CryptozShared.TCard[];
  cardsToShow?: CryptozShared.TCard[];
  cardAttack: CryptozShared.TCard;
  variants: CryptozShared.TVariant<number>[];
  onSubmit: (id: number, selectedCard: CryptozShared.TCard) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}
