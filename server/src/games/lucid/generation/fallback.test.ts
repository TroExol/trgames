import {
  describe,
  expect,
  it,
} from 'vitest';

import { eventSchema, worldSchema } from '@/games/lucid/generation/schema';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { buildTrack, eventCellIds } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

// Реальные номера клеток событий для конкретного числа игроков — тем же способом,
// каким их строит setupParty (сид трека всегда `${seed}:track`)
const trackEventCellIds = (playerCount: number, seed = 'fallback'): number[] =>
  eventCellIds(buildTrack({ random: createRandom(`${seed}:track`), playerCount }));

describe('loadFallbackContent', () => {
  it('запасная тема проходит валидацию', () => {
    const { theme } = loadFallbackContent(trackEventCellIds(6), 'fallback');

    expect(worldSchema.safeParse({ theme }).success).toBe(true);
  });

  it('каждое событие пула проходит валидацию', () => {
    // На треке для двоих игроков клеток событий ровно 48 — столько же, сколько в пуле,
    // так что раскладка захватывает весь пул целиком, без остатка
    const { events } = loadFallbackContent(trackEventCellIds(2), 'fallback');

    expect(Object.values(events)).toHaveLength(48);
    Object.values(events).forEach(event => {
      expect(eventSchema.safeParse(event).success).toBe(true);
    });
  });

  it('события покрывают ровно переданные клетки — без лишних и без пропусков', () => {
    // На коротком треке (шесть игроков) в игру попадает только часть пула,
    // на длинном (двое) — весь пул: раскладка обязана сойтись в обоих случаях
    [6, 2].forEach(playerCount => {
      const cellIds = trackEventCellIds(playerCount);
      const { events } = loadFallbackContent(cellIds, 'fallback');

      expect(Object.keys(events).map(Number).sort((a, b) => a - b)).toEqual(
        [...cellIds].sort((a, b) => a - b),
      );
    });
  });

  it('ключ словаря совпадает с полем cellId события', () => {
    const { events } = loadFallbackContent(trackEventCellIds(6), 'fallback');

    Object.entries(events).forEach(([cellId, event]) => {
      expect(Number(cellId)).toBe(event.cellId);
    });
  });

  it('один сид даёт одну и ту же раскладку', () => {
    const cellIds = trackEventCellIds(6);

    expect(loadFallbackContent(cellIds, 'same')).toEqual(loadFallbackContent(cellIds, 'same'));
  });

  it('разные сиды дают разную раскладку', () => {
    const cellIds = trackEventCellIds(6);

    expect(loadFallbackContent(cellIds, 'seed-a')).not.toEqual(loadFallbackContent(cellIds, 'seed-b'));
  });
});
