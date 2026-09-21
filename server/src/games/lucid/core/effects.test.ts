import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { applyEffect } from '@/games/lucid/core/effects';

const twoPlayers = () => makeG({
  players: [
    { id: 'a', nickname: 'Аня', position: 1, resource: 2 },
    { id: 'b', nickname: 'Боря', position: 0, resource: 9 },
  ],
});

const gain = (value: number): LucidShared.TAtom => ({
  kind: LucidShared.EAtomKind.RESOURCE,
  target: LucidShared.ETarget.SELF,
  value,
});

const richCondition: LucidShared.TCondition = {
  field: LucidShared.EConditionField.RESOURCE,
  operator: LucidShared.EConditionOperator.GTE,
  value: 5,
};

describe('applyEffect', () => {
  it('применяет атомы подряд', () => {
    const G = applyEffect(twoPlayers(), 'a', { atoms: [gain(2), gain(3)] });

    expect(G.players.a.resource).toBe(7);
  });

  it('при выполненном условии берёт основную ветку', () => {
    const G = applyEffect(twoPlayers(), 'b', {
      condition: richCondition,
      atoms: [gain(1)],
      otherwise: [gain(-9)],
    });

    expect(G.players.b.resource).toBe(10);
  });

  it('при невыполненном условии берёт запасную ветку', () => {
    const G = applyEffect(twoPlayers(), 'a', {
      condition: richCondition,
      atoms: [gain(1)],
      otherwise: [gain(4)],
    });

    expect(G.players.a.resource).toBe(6);
  });

  it('невыполненное условие без запасной ветки ничего не делает', () => {
    const G = applyEffect(twoPlayers(), 'a', { condition: richCondition, atoms: [gain(1)] });

    expect(G.players.a.resource).toBe(2);
  });

  it('условие проверяется по положению игрока', () => {
    const G = applyEffect(twoPlayers(), 'a', {
      condition: {
        field: LucidShared.EConditionField.POSITION,
        operator: LucidShared.EConditionOperator.GT,
        value: 0,
      },
      atoms: [gain(5)],
    });

    expect(G.players.a.resource).toBe(7);
  });
});
