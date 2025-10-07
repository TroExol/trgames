import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCanEvadeModifier = (currentValue: boolean, card: AbstractCard) => boolean;
