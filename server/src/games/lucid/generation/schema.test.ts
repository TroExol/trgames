import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  eventBatchSchema,
  eventSchema,
  worldSchema,
} from '@/games/lucid/generation/schema';

const validEvent = {
  cellId: 3,
  title: 'Кислотное болото',
  text: 'Тебя затянуло по пояс',
  options: [
    {
      text: 'Выбираться самому',
      threshold: 4,
      success: {
        atoms: [{
          kind: LucidShared.EAtomKind.MOVE,
          target: LucidShared.ETarget.SELF,
          value: 2,
        }],
      },
      failure: {
        atoms: [{
          kind: LucidShared.EAtomKind.SKIP_TURN,
          target: LucidShared.ETarget.SELF,
          value: 1,
        }],
      },
    },
  ],
};

const withAtoms = (atoms: unknown[]) => ({
  ...validEvent,
  options: [{ ...validEvent.options[0], success: { atoms } }],
});

describe('eventSchema', () => {
  it('принимает корректное событие', () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it('отклоняет порог кубика вне диапазона', () => {
    const invalid = { ...validEvent, options: [{ ...validEvent.options[0], threshold: 7 }] };

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет неизвестный вид атома', () => {
    const invalid = withAtoms([{ kind: 'EXPLODE', target: LucidShared.ETarget.SELF, value: 1 }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет значение вне диапазона своего вида атома', () => {
    const invalid = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: 99,
    }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет отрицательный пропуск хода, хотя для сдвига минус допустим', () => {
    const negativeSkip = withAtoms([{
      kind: LucidShared.EAtomKind.SKIP_TURN,
      target: LucidShared.ETarget.SELF,
      value: -1,
    }]);
    const negativeMove = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: -1,
    }]);

    expect(eventSchema.safeParse(negativeSkip).success).toBe(false);
    expect(eventSchema.safeParse(negativeMove).success).toBe(true);
  });

  it('отклоняет лишние поля внутри атома', () => {
    const invalid = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: 1,
      condition: { nested: true },
    }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('worldSchema', () => {
  it('принимает корректную тему', () => {
    const result = worldSchema.safeParse({
      theme: {
        name: 'Пираты Карибского моря',
        resourceName: 'дублоны',
        palette: ['#102030', '#405060', '#708090', '#a0b0c0', '#d0e0f0'],
      },
    });

    expect(result.success).toBe(true);
  });

  it('отклоняет палитру неверного формата', () => {
    const result = worldSchema.safeParse({
      theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['красный'] },
    });

    expect(result.success).toBe(false);
  });
});

describe('eventBatchSchema', () => {
  it('принимает пачку событий', () => {
    expect(eventBatchSchema.safeParse({ events: [validEvent] }).success).toBe(true);
  });

  it('отклоняет пустую пачку', () => {
    expect(eventBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });
});
