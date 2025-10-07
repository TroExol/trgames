import type { Player } from '@/games/cryptoz/entities/Players/Player';

export type TDamageTookTrigger = (damage: number, attacker?: Player) => void;
