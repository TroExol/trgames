import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardEssenceModifier = (currentValue: number, card: AbstractCard) => number;
