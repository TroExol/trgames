import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardPlayedTrigger = (card: AbstractCard) => Promise<void> | void;
