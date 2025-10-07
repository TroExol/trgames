import {
  describe,
  expect,
  it,
} from 'vitest';

import { CursedSeal } from '@/games/cryptoz/entities/Cards/customCards/CursedSeal';

import { PriceModifier } from './PriceModifier';

describe('PriceModifier', () => {
  it('Корректно применяет', () => {
    const modifier = new PriceModifier('1', value => value + 1);
    expect(modifier.apply(1, new CursedSeal())).toBe(2);
  });

  it('Нельзя сделать значение меньше 0', () => {
    const modifier = new PriceModifier('1', value => value - 999);
    expect(modifier.apply(1, new CursedSeal())).toBe(0);
  });
});
