import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { AbstractModifier } from './AbstractModifier';

class TestModifier extends AbstractModifier {
  constructor() {
    super('test', (count: number) => count + 1);
  }
}

describe('AbstractModifier', () => {
  let modifier: TestModifier;

  beforeEach(() => {
    modifier = new TestModifier();
  });

  it('Создается инстанс', () => {
    expect(modifier).toBeInstanceOf(AbstractModifier);
  });

  it('Применяет модификатор', () => {
    expect(modifier.apply(1)).toBe(2);
  });
});
