import type { CryptozShared } from '@trgames/shared';

export interface TSuggestEvadeProps {
  title: string;
  cards: CryptozShared.TCard[];
  cardsToShow?: CryptozShared.TCard[];
  cardAttack: CryptozShared.TCard;
  variants: CryptozShared.TVariant<number>[];
  onSubmit: (id: number, selectedCard: CryptozShared.TCard) => void;
}
