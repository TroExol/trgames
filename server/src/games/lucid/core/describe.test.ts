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
        field: LucidShared.EConditionField.RESOURCE,
        operator: LucidShared.EConditionOperator.LT,
        value: 10,
      },
      atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)],
    };

    expect(LucidShared.describeEffect(effect, 'монеты')).toBe('если монеты < 10: ты: +1 клетка, иначе: ничего');
  });
});

describe('buildEffectHint', () => {
  const { EAtomKind, ETarget } = LucidShared;

  it('знак у MOVE и RESOURCE по value, числа нет', () => {
    const hint = LucidShared.buildEffectHint({
      atoms: [atom(EAtomKind.MOVE, ETarget.SELF, 3), atom(EAtomKind.RESOURCE, ETarget.FIRST, -2)],
    });

    expect(hint).toEqual([
      { kind: EAtomKind.MOVE, target: ETarget.SELF, sign: 1 },
      { kind: EAtomKind.RESOURCE, target: ETarget.FIRST, sign: -1 },
    ]);
  });

  it('SKIP_TURN и SWAP_WITH_FIRST без знака', () => {
    const hint = LucidShared.buildEffectHint({
      atoms: [atom(EAtomKind.SKIP_TURN, ETarget.SELF, 2), atom(EAtomKind.SWAP_WITH_FIRST, ETarget.SELF, 0)],
    });

    expect(hint).toEqual([
      { kind: EAtomKind.SKIP_TURN, target: ETarget.SELF },
      { kind: EAtomKind.SWAP_WITH_FIRST, target: ETarget.SELF },
    ]);
  });

  it('атомы otherwise входят в пункты, одинаковые не повторяются', () => {
    const hint = LucidShared.buildEffectHint({
      atoms: [atom(EAtomKind.MOVE, ETarget.SELF, 2)],
      condition: {
        field: LucidShared.EConditionField.RESOURCE,
        operator: LucidShared.EConditionOperator.GTE,
        value: 3,
      },
      otherwise: [atom(EAtomKind.MOVE, ETarget.SELF, 4), atom(EAtomKind.MOVE, ETarget.ALL, -1)],
    });

    expect(hint).toEqual([
      { kind: EAtomKind.MOVE, target: ETarget.SELF, sign: 1 },
      { kind: EAtomKind.MOVE, target: ETarget.ALL, sign: -1 },
    ]);
  });

  it('нет ветки — пустой список', () => {
    expect(LucidShared.buildEffectHint(undefined)).toEqual([]);
  });
});

describe('цель CHOSEN', () => {
  const chosenMove = atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.CHOSEN, -4);
  const option: LucidShared.TOption = { text: 'Толкнуть', success: { atoms: [chosenMove] } };

  it('подпись цели — «выбранный»', () => {
    expect(LucidShared.describeAtom(chosenMove, 'монеты')).toBe('выбранный: −4 клетки');
  });

  it('вариант с CHOSEN в любой ветке требует цель', () => {
    expect(LucidShared.optionNeedsTarget(option)).toBe(true);
    expect(LucidShared.optionNeedsTarget({ text: 'Рискнуть', threshold: 3, success: { atoms: [] }, failure: option.success }))
      .toBe(true);
    expect(LucidShared.optionNeedsTarget({
      text: 'Идти',
      success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)] },
    })).toBe(false);
  });

  it('запись истории называет цель', () => {
    const view: LucidShared.TOptionView = {
      ...option,
      revealed: { success: true, failure: false },
      hint: LucidShared.buildOptionHint(option),
    };
    const entry: LucidShared.THistoryEntry = {
      playerId: 'a',
      nickname: 'Ваня',
      optionIndex: 0,
      branch: 'success',
      targetNickname: 'Петя',
      lines: [],
    };

    expect(LucidShared.describeHistoryEntry(entry, view, 'монеты')).toBe('Ваня — «Толкнуть», цель Петя — выбранный: −4 клетки');
  });

  it('запись истории показывает text ветки перед цифрами', () => {
    const withText: LucidShared.TOption = { text: 'Толкнуть', success: { text: 'Падает с обрыва', atoms: [chosenMove] } };
    const view: LucidShared.TOptionView = {
      ...withText,
      revealed: { success: true, failure: false },
      hint: LucidShared.buildOptionHint(withText),
    };
    const entry: LucidShared.THistoryEntry = {
      playerId: 'a',
      nickname: 'Ваня',
      optionIndex: 0,
      branch: 'success',
      lines: [],
    };

    expect(LucidShared.describeHistoryEntry(entry, view, 'монеты')).toBe('Ваня — «Толкнуть» — Падает с обрыва · выбранный: −4 клетки');
  });
});
