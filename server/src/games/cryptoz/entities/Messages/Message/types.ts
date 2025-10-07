import type { Player } from '@/games/cryptoz/entities/Players/Player';

export interface TMessageConstructorParams {
  sender: Player;
  message: string;
}
