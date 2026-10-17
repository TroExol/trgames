import {
  describe,
  expect,
  it,
} from 'vitest';

import { isNewRoll, revealPlan } from '@/routes/games/lucid/PartyPage/stores/rollReveal';

describe('isNewRoll', () => {
  it('броска не было — нового броска нет', () => {
    expect(isNewRoll(undefined, undefined)).toBe(false);
  });

  it('первый бросок партии — новый', () => {
    expect(isNewRoll(undefined, { playerId: 'a', value: 4, stateId: 1 })).toBe(true);
  });

  it('разные stateId — новый бросок, даже если значение то же самое', () => {
    expect(isNewRoll(
      { playerId: 'a', value: 4, stateId: 1 },
      { playerId: 'b', value: 4, stateId: 3 },
    )).toBe(true);
  });

  it('тот же stateId — тот же бросок, старое состояние переслали заново', () => {
    expect(isNewRoll(
      { playerId: 'a', value: 4, stateId: 1 },
      { playerId: 'a', value: 4, stateId: 1 },
    )).toBe(false);
  });

  it('бросок без клейма stateId — старый, не проигрывается заново при каждом обновлении', () => {
    expect(isNewRoll({ playerId: 'a', value: 4 }, { playerId: 'a', value: 4 })).toBe(false);
    expect(isNewRoll(undefined, { playerId: 'a', value: 4 })).toBe(false);
  });

  it('первый бросок с клеймом после старых без него — новый', () => {
    expect(isNewRoll({ playerId: 'a', value: 4 }, { playerId: 'b', value: 2, stateId: 7 })).toBe(true);
  });
});

describe('revealPlan', () => {
  it('обычный бросок хода: крутим и идём', () => {
    expect(revealPlan({ playerId: 'p', value: 4 })).toEqual({ spin: true, walk: true });
  });

  it('порог варианта: крутим, не идём', () => {
    expect(revealPlan({ playerId: 'p', value: 4, threshold: 3 })).toEqual({ spin: true, walk: false });
  });

  it('два кубика на выбор: крутим, фишка ждёт выбора', () => {
    expect(revealPlan({ playerId: 'p', value: 2, values: [2, 5], pending: true })).toEqual({ spin: true, walk: false });
  });

  it('выбранный кубик: не крутим заново, сразу идём', () => {
    expect(revealPlan({ playerId: 'p', value: 5, values: [2, 5], picked: 1 })).toEqual({ spin: false, walk: true });
  });
});
