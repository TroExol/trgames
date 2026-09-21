import {
  describe,
  expect,
  it,
} from 'vitest';

import { eventSchema, worldSchema } from '@/games/lucid/generation/schema';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { eventCellIds } from '@/games/lucid/core/track';
import { setupParty } from '@/games/lucid/core/setup';

describe('loadFallbackContent', () => {
  it('запасная тема проходит валидацию', () => {
    expect(worldSchema.safeParse({ theme: loadFallbackContent().theme }).success).toBe(true);
  });

  it('все запасные события проходят валидацию', () => {
    Object.values(loadFallbackContent().events).forEach(event => {
      expect(eventSchema.safeParse(event).success).toBe(true);
    });
  });

  it('все запасные события попадают на реальные клетки самого короткого трека', () => {
    const state = setupParty({
      seed: 'fallback',
      players: Array.from({ length: 6 }, (_, index) => ({
        id: `p${index}`,
        nickname: `Игрок ${index}`,
      })),
      content: loadFallbackContent(),
    });
    const allowed = new Set(eventCellIds(state.G.track));

    Object.keys(state.G.events).forEach(cellId => {
      expect(allowed.has(Number(cellId))).toBe(true);
    });
  });

  it('ключ события совпадает с его номером клетки', () => {
    Object.entries(loadFallbackContent().events).forEach(([cellId, event]) => {
      expect(Number(cellId)).toBe(event.cellId);
    });
  });
});
