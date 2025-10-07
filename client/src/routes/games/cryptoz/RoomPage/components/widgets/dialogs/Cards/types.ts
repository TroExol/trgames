import type { CryptozShared } from '@trgames/shared';

export interface TCardsProps {
  cards: CryptozShared.TCard[];
  cardsSubtitle?: { [cardId: string]: string };
  countCardsToSelect?: number | null;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, cards: CryptozShared.TCard[]) => void;
}
