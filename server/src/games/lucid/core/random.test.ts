import {
  describe,
  expect,
  it,
} from 'vitest';

import { createRandom, rollDie } from '@/games/lucid/core/random';

const rollMany = (seed: string, count: number): number[] => {
  let state = createRandom(seed);
  const values: number[] = [];

  for (let i = 0; i < count; i++) {
    const roll = rollDie(state);
    values.push(roll.value);
    state = roll.state;
  }

  return values;
};

describe('random', () => {
  it('с одного сида даёт одну и ту же последовательность', () => {
    expect(rollMany('seed-1', 10)).toEqual(rollMany('seed-1', 10));
  });

  it('с разных сидов даёт разные последовательности', () => {
    expect(rollMany('seed-1', 10)).not.toEqual(rollMany('seed-2', 10));
  });

  it('бросок кубика всегда от 1 до 6', () => {
    rollMany('dice', 500).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
  });

  it('выпадают все шесть граней', () => {
    expect(new Set(rollMany('faces', 300)).size).toBe(6);
  });

  it('не меняет исходное состояние', () => {
    const state = createRandom('pure');
    const before = { ...state };

    rollDie(state);

    expect(state).toEqual(before);
  });
});
