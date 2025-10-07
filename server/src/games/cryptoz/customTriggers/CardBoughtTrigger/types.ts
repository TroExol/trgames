import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export type TCardBoughtTrigger = (card: AbstractCard, price: number, boughtFrom: 'darknessMadness' | 'companion' | 'harbinger' | 'market') => void;
