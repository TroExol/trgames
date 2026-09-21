import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { resolveOption } from '@/games/lucid/core/options';

const onePlayer = () => makeG({
  players: [{ id: 'a', nickname: 'Аня', position: 1, resource: 4 }],
});

const gain = (value: number): LucidShared.TAtom => ({
  kind: LucidShared.EAtomKind.RESOURCE,
  target: LucidShared.ETarget.SELF,
  value,
});

describe('resolveOption', () => {
  it('вариант со стоимостью списывает ресурс и применяет успех', () => {
    const G = resolveOption(onePlayer(), 'a', {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(5)] },
    });

    expect(G?.players.a.resource).toBe(7);
  });

  it('при нехватке ресурса вариант недоступен', () => {
    const G = resolveOption(onePlayer(), 'a', {
      text: 'Заплатить',
      cost: 9,
      success: { atoms: [gain(5)] },
    });

    expect(G).toBeNull();
  });

  it('вариант с порогом расходует бросок кубика', () => {
    const before = onePlayer();
    const G = resolveOption(before, 'a', {
      text: 'Рискнуть',
      threshold: 4,
      success: { atoms: [gain(1)] },
      failure: { atoms: [gain(-1)] },
    });

    expect(G?.random).not.toEqual(before.random);
  });

  it('порог 1 всегда удаётся', () => {
    const G = resolveOption(onePlayer(), 'a', {
      text: 'Точно',
      threshold: 1,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.players.a.resource).toBe(9);
  });

  it('порог 7 никогда не удаётся', () => {
    const G = resolveOption(onePlayer(), 'a', {
      text: 'Никогда',
      threshold: 7,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.players.a.resource).toBe(0);
  });

  it('неудача без описанных последствий просто ничего не делает', () => {
    const G = resolveOption(onePlayer(), 'a', {
      text: 'Попробовать',
      threshold: 7,
      success: { atoms: [gain(5)] },
    });

    expect(G?.players.a.resource).toBe(4);
  });

  it('вариант с ценой и порогом списывает ресурс независимо от исхода броска', () => {
    const before = onePlayer();
    const G = resolveOption(before, 'a', {
      text: 'Купить попытку',
      cost: 2,
      threshold: 7,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-1)] },
    });

    // Порог 7 недостижим, значит бросок всегда неудачен: 4 − 2 за вход, затем −1
    expect(G?.players.a.resource).toBe(1);
    expect(G?.random).not.toEqual(before.random);
  });
});
