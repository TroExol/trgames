import type { Player } from '@/games/cryptoz/entities/Players/Player';

export type TKilledTrigger = (killer?: Player) => void;
