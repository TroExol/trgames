import {
  describe,
  expect,
  it,
} from 'vitest';

import { makeG } from '@/games/lucid/vitest/factories';
import { rollAndMove } from '@/games/lucid/core/moves';

describe('rollAndMove', () => {
  it('запоминает выпавшую грань', () => {
    const G = makeG({ players: [{ id: 'p1', nickname: 'Аня', position: 0, resource: 3 }] });
    const after = rollAndMove(G, 'p1');

    expect(after.lastRoll?.playerId).toBe('p1');
    expect(after.lastRoll?.value).toBeGreaterThanOrEqual(1);
    expect(after.lastRoll?.value).toBeLessThanOrEqual(6);
  });
});
