import {
  describe,
  expect,
  it,
} from 'vitest';

import { pluralizeSteps } from '@/lib/lucid/pluralize';

describe('pluralizeSteps', () => {
  it('1, 21 — «шаг»', () => {
    expect(pluralizeSteps(1)).toBe('1 шаг');
    expect(pluralizeSteps(21)).toBe('21 шаг');
  });

  it('2, 3, 4, 22 — «шага»', () => {
    expect(pluralizeSteps(2)).toBe('2 шага');
    expect(pluralizeSteps(3)).toBe('3 шага');
    expect(pluralizeSteps(4)).toBe('4 шага');
    expect(pluralizeSteps(22)).toBe('22 шага');
  });

  it('0, 5, 11, 12, 13, 14, 25 — «шагов»', () => {
    expect(pluralizeSteps(0)).toBe('0 шагов');
    expect(pluralizeSteps(5)).toBe('5 шагов');
    expect(pluralizeSteps(11)).toBe('11 шагов');
    expect(pluralizeSteps(12)).toBe('12 шагов');
    expect(pluralizeSteps(13)).toBe('13 шагов');
    expect(pluralizeSteps(14)).toBe('14 шагов');
    expect(pluralizeSteps(25)).toBe('25 шагов');
  });
});
