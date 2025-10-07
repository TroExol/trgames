import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardGloryShardsModifier = (currentValue: number, card: AbstractCard) => number;
