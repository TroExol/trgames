import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TPriceModifier = (currentValue: number, card: AbstractCard) => number;
