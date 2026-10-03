import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

// Раннера тестов у @trgames/shared нет (только typecheck+eslint) — тест на
// чистые функции описания атома/эффекта живёт здесь и импортирует их из шаред-пакета
const atom = (
  kind: LucidShared.EAtomKind,
  target: LucidShared.ETarget,
  value: number,
): LucidShared.TAtom => ({ kind, target, value });

describe('describeAtom', () => {
  it('MOVE — цель, знак и склонение клеток', () => {
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 3), 'монеты'))
      .toBe('ты: +3 клетки');
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.FIRST, -2), 'монеты'))
      .toBe('лидер: −2 клетки');
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1), 'монеты'))
      .toBe('ты: +1 клетка');
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 0), 'монеты'))
      .toBe('ты: на месте');
  });

  it('RESOURCE — название ресурса от темы, не склоняется', () => {
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.LAST, 2), 'заряды'))
      .toBe('отстающий: заряды +2');
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.ALL, -1), 'заряды'))
      .toBe('все: заряды −1');
  });

  it('SKIP_TURN — единственное и множественное число', () => {
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.SKIP_TURN, LucidShared.ETarget.FIRST, 1), 'монеты'))
      .toBe('лидер: пропуск хода');
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.SKIP_TURN, LucidShared.ETarget.ALL, 2), 'монеты'))
      .toBe('все: пропуск 2 ходов');
  });

  it('SWAP_WITH_FIRST — фиксированная строка независимо от цели', () => {
    expect(LucidShared.describeAtom(atom(LucidShared.EAtomKind.SWAP_WITH_FIRST, LucidShared.ETarget.ALL, 0), 'монеты'))
      .toBe('ты меняешься местами с лидером');
  });
});

describe('describeEffect', () => {
  it('без условия — атомы через запятую', () => {
    const effect: LucidShared.TEffect = {
      atoms: [
        atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 2),
        atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.ALL, -1),
      ],
    };

    expect(LucidShared.describeEffect(effect, 'монеты')).toBe('ты: +2 клетки, все: монеты −1');
  });

  it('с условием и запасной веткой', () => {
    const effect: LucidShared.TEffect = {
      condition: {
        field: LucidShared.EConditionField.RESOURCE,
        operator: LucidShared.EConditionOperator.GTE,
        value: 5,
      },
      atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)],
      otherwise: [atom(LucidShared.EAtomKind.SKIP_TURN, LucidShared.ETarget.SELF, 1)],
    };

    expect(LucidShared.describeEffect(effect, 'монеты'))
      .toBe('если монеты ≥ 5: ты: +1 клетка, иначе: ты: пропуск хода');
  });

  it('с условием без запасной ветки — «иначе: ничего»', () => {
    const effect: LucidShared.TEffect = {
      condition: {
        field: LucidShared.EConditionField.POSITION,
        operator: LucidShared.EConditionOperator.LT,
        value: 10,
      },
      atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)],
    };

    expect(LucidShared.describeEffect(effect, 'монеты')).toBe('если клетка < 10: ты: +1 клетка, иначе: ничего');
  });
});
