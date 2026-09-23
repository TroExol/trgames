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
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(5)] },
    });

    expect(G?.players.a.resource).toBe(7);
  });

  it('лента: выбор варианта идёт раньше эффекта', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(5)] },
    });

    expect(G?.log).toEqual(['Аня выбирает «Заплатить»', 'Аня: монеты +5']);
  });

  it('при нехватке ресурса вариант недоступен', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Заплатить',
      cost: 9,
      success: { atoms: [gain(5)] },
    });

    expect(G).toBeNull();
  });

  it('вариант с порогом расходует бросок кубика', () => {
    const before = onePlayer();
    const G = resolveOption(before, 'a', 0, {
      text: 'Рискнуть',
      threshold: 4,
      success: { atoms: [gain(1)] },
      failure: { atoms: [gain(-1)] },
    });

    expect(G?.random).not.toEqual(before.random);
  });

  it('порог 1 всегда удаётся', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Точно',
      threshold: 1,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.players.a.resource).toBe(9);
  });

  it('порог 7 никогда не удаётся', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Никогда',
      threshold: 7,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.players.a.resource).toBe(0);
  });

  it('неудача без описанных последствий просто ничего не делает', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Попробовать',
      threshold: 7,
      success: { atoms: [gain(5)] },
    });

    expect(G?.players.a.resource).toBe(4);
    expect(G?.log.at(-1)).toBe('ничего не произошло');
  });

  it('вариант с ценой и порогом списывает ресурс независимо от исхода броска', () => {
    const before = onePlayer();
    const G = resolveOption(before, 'a', 0, {
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

  it('без порога ветка истории — всегда success, лежит на клетке игрока', () => {
    const G = resolveOption(onePlayer(), 'a', 2, {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(5)] },
    });

    expect(G?.cellHistory[1]).toEqual([{
      playerId: 'a',
      nickname: 'Аня',
      optionIndex: 2,
      branch: 'success',
      roll: undefined,
      lines: ['Аня выбирает «Заплатить»', 'Аня: монеты +5'],
    }]);
  });

  it('порог 1 всегда удаётся — ветка истории success с броском', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Точно',
      threshold: 1,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.cellHistory[1]).toHaveLength(1);
    expect(G?.cellHistory[1][0].branch).toBe('success');
    expect(G?.cellHistory[1][0].roll).toBeGreaterThanOrEqual(1);
  });

  it('порог 7 никогда не удаётся — ветка истории failure с броском', () => {
    const G = resolveOption(onePlayer(), 'a', 0, {
      text: 'Никогда',
      threshold: 7,
      success: { atoms: [gain(5)] },
      failure: { atoms: [gain(-4)] },
    });

    expect(G?.cellHistory[1]).toHaveLength(1);
    expect(G?.cellHistory[1][0].branch).toBe('failure');
    expect(G?.cellHistory[1][0].roll).toBeLessThan(7);
  });

  it('повторный выбор на той же клетке добавляет запись, не заменяет прежнюю', () => {
    const first = resolveOption(onePlayer(), 'a', 0, {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(1)] },
    });

    const second = resolveOption(first!, 'a', 0, {
      text: 'Заплатить',
      cost: 2,
      success: { atoms: [gain(1)] },
    });

    expect(second?.cellHistory[1]).toHaveLength(2);
  });
});
