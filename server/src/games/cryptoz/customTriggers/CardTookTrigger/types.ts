import type { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardTookTrigger = (
  target: 'hand' | 'deck' | 'discard',
  card: AbstractCard,
  from: CardGroup<ECardGroupType.ANY>,
  prevOwnerNickname: string | undefined,
) => void;
