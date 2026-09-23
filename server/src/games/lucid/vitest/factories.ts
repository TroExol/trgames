import { LucidShared } from '@trgames/shared';

import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { buildTrack, eventCellIds } from '@/games/lucid/core/track';
import { setupParty } from '@/games/lucid/core/setup';
import { createRandom } from '@/games/lucid/core/random';

// Прямой трек: 0 → 1 → 2 → 3 → 4, где 0 старт и 4 финиш
export const lineTrack = (): LucidShared.TTrack => ({
  startId: 0,
  finishId: 4,
  cells: [
    { id: 0, type: LucidShared.ECellType.START, next: [1] },
    { id: 1, type: LucidShared.ECellType.EVENT, next: [2] },
    { id: 2, type: LucidShared.ECellType.EVENT, next: [3] },
    { id: 3, type: LucidShared.ECellType.EVENT, next: [4] },
    { id: 4, type: LucidShared.ECellType.FINISH, next: [] },
  ],
});

// Трек с развилкой: 0 → 1, дальше ветки 2→3 и 4→5, обе сходятся в 6 → 7
export const forkTrack = (): LucidShared.TTrack => ({
  startId: 0,
  finishId: 7,
  cells: [
    { id: 0, type: LucidShared.ECellType.START, next: [1] },
    { id: 1, type: LucidShared.ECellType.EVENT, next: [2, 4] },
    { id: 2, type: LucidShared.ECellType.EVENT, next: [3] },
    { id: 3, type: LucidShared.ECellType.EVENT, next: [6] },
    { id: 4, type: LucidShared.ECellType.EVENT, next: [5] },
    { id: 5, type: LucidShared.ECellType.EVENT, next: [6] },
    { id: 6, type: LucidShared.ECellType.EVENT, next: [7] },
    { id: 7, type: LucidShared.ECellType.FINISH, next: [] },
  ],
});

// Две развилки подряд: клетка 1 расходится на ветки 2→3 и 4→5, обе сходятся
// в клетке 6, которая сама является развилкой на ветки 7→8 и 9→10,
// сходящиеся в клетке 11 перед финишем 12
export const doubleForkTrack = (): LucidShared.TTrack => ({
  startId: 0,
  finishId: 12,
  cells: [
    { id: 0, type: LucidShared.ECellType.START, next: [1] },
    { id: 1, type: LucidShared.ECellType.EVENT, next: [2, 4] },
    { id: 2, type: LucidShared.ECellType.EVENT, next: [3] },
    { id: 3, type: LucidShared.ECellType.EVENT, next: [6] },
    { id: 4, type: LucidShared.ECellType.EVENT, next: [5] },
    { id: 5, type: LucidShared.ECellType.EVENT, next: [6] },
    { id: 6, type: LucidShared.ECellType.EVENT, next: [7, 9] },
    { id: 7, type: LucidShared.ECellType.EVENT, next: [8] },
    { id: 8, type: LucidShared.ECellType.EVENT, next: [11] },
    { id: 9, type: LucidShared.ECellType.EVENT, next: [10] },
    { id: 10, type: LucidShared.ECellType.EVENT, next: [11] },
    { id: 11, type: LucidShared.ECellType.EVENT, next: [12] },
    { id: 12, type: LucidShared.ECellType.FINISH, next: [] },
  ],
});

interface TMakeGParams {
  track?: LucidShared.TTrack;
  players?: { id: string; nickname: string; position: number; resource: number }[];
  events?: Record<number, LucidShared.TEvent>;
}

export const makeG = ({
  track = lineTrack(),
  players = [
    { id: 'a', nickname: 'Аня', position: 0, resource: 3 },
    { id: 'b', nickname: 'Боря', position: 0, resource: 3 },
  ],
  events = {},
}: TMakeGParams = {}): LucidShared.TG => ({
  players: players.reduce<Record<string, LucidShared.TPlayer>>(
    (acc, player) => ({ ...acc, [player.id]: { ...player, skipTurns: 0 } }),
    {},
  ),
  order: players.map(player => player.id),
  track,
  events,
  theme: { name: 'Тест', resourceName: 'монеты', palette: ['#111111', '#222222', '#333333'] },
  random: createRandom('test'),
  visited: [track.startId],
  log: [],
  branchChoices: [],
  pendingSteps: 0,
  cellHistory: {},
});

interface TMakeFallbackPartyParams {
  seed: string;
  playerCount?: number;
}

// Запасная партия строится под конкретный трек, а трек — детерминированно из сида.
// Поэтому трек собирается дважды: здесь ради номеров клеток и внутри setupParty
export const makeFallbackParty = ({
  seed,
  playerCount = 3,
}: TMakeFallbackPartyParams): LucidShared.TState => {
  const track = buildTrack({ random: createRandom(`${seed}:track`), playerCount });

  return setupParty({
    seed,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `p${index}`,
      nickname: `Игрок ${index}`,
    })),
    content: loadFallbackContent(eventCellIds(track), seed),
  });
};
