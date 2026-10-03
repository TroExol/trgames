import {
  describe,
  expect,
  it,
} from 'vitest';

import { measureParties } from '@/games/lucid/reports/balance';

describe('замер партий автоигрой', () => {
  it('каждая партия доходит до победы и считает ходы', () => {
    const rows = measureParties({ playerCounts: [2, 4], seeds: ['a', 'b'] });

    expect(rows.map(row => row.players)).toEqual([2, 4]);
    rows.forEach(row => expect(row.turnsPerPlayer).toBeGreaterThan(5));
  });
});
