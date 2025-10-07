import type { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardRemovedTrigger = (
  card: AbstractCard,
  from: CardGroup<ECardGroupType.ANY>,
  removedTo: CardGroup<ECardGroupType.ANY>,
) => void;
