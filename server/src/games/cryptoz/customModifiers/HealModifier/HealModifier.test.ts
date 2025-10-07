import {
  describe,
  expect,
  it,
} from 'vitest';

import { HealModifier } from './HealModifier';

describe('HealModifier', () => {
  it('Корректно применяет', () => {
    const modifier = new HealModifier('1', value => value + 1);
    expect(modifier.apply(1)).toBe(2);
  });

  it('Нельзя сделать значение меньше 0', () => {
    const modifier = new HealModifier('1', value => value - 999);
    expect(modifier.apply(1)).toBe(0);
  });
});
