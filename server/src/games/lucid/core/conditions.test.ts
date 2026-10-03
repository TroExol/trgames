import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { checkCondition } from '@/games/lucid/core/conditions';

// Игрок с запасом ресурса 5, стоящий на клетке 4
const player: LucidShared.TPlayer = {
  id: 'a',
  nickname: 'Аня',
  position: 4,
  resource: 5,
  skipTurns: 0,
};

const check = (
  field: LucidShared.EConditionField,
  operator: LucidShared.EConditionOperator,
  value: number,
): boolean => checkCondition(player, { field, operator, value });

describe('checkCondition', () => {
  it('сравнивает запас ресурса всеми операторами', () => {
    const {
      EQ,
      GT,
      GTE,
      LT,
      LTE,
    } = LucidShared.EConditionOperator;
    const resource = LucidShared.EConditionField.RESOURCE;

    expect(check(resource, LT, 6)).toBe(true);
    expect(check(resource, LT, 5)).toBe(false);
    expect(check(resource, LTE, 5)).toBe(true);
    expect(check(resource, LTE, 4)).toBe(false);
    expect(check(resource, GT, 4)).toBe(true);
    expect(check(resource, GT, 5)).toBe(false);
    expect(check(resource, GTE, 5)).toBe(true);
    expect(check(resource, GTE, 6)).toBe(false);
    expect(check(resource, EQ, 5)).toBe(true);
    expect(check(resource, EQ, 4)).toBe(false);
  });

  it('сравнивает положение на треке', () => {
    const { EQ, GT, LT } = LucidShared.EConditionOperator;
    const position = LucidShared.EConditionField.POSITION;

    expect(check(position, EQ, 4)).toBe(true);
    expect(check(position, GT, 3)).toBe(true);
    expect(check(position, LT, 3)).toBe(false);
  });

  it('поля не путаются между собой', () => {
    const { EQ } = LucidShared.EConditionOperator;

    expect(check(LucidShared.EConditionField.RESOURCE, EQ, 4)).toBe(false);
    expect(check(LucidShared.EConditionField.POSITION, EQ, 4)).toBe(true);
  });
});
