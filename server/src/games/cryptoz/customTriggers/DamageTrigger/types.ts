import type { Player } from '@/games/cryptoz/entities/Players/Player';

export type TDamageTrigger = (damage: number, target: Player) => void;
