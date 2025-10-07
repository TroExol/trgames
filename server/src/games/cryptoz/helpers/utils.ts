import type { CryptozShared } from '@trgames/shared';

import type { Player } from '@/games/cryptoz/entities/Players/Player';

export function toPlayerVariant(player: Player): CryptozShared.TVariant<string> {
  return { id: player.nickname, value: player.nickname };
}
