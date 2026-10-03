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

  it('с режимом покупателя партия на 2 игроках доходит до победы и считает покупки', () => {
    const [row] = measureParties({ playerCounts: [2], seeds: ['a', 'b'], buyer: true });

    expect(row.turnsPerPlayer).toBeGreaterThan(5);
    expect(row.cardsBought).toBeGreaterThan(0);
  });

  it('без режима покупателя карты не покупаются', () => {
    const [row] = measureParties({ playerCounts: [2], seeds: ['a', 'b'] });

    expect(row.cardsBought).toBe(0);
  });
});
