import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TDamageModifier = (currentValue: number, card: AbstractCard) => number;
