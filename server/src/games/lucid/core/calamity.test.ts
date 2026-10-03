import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { drawEvent, isCalamity } from '@/games/lucid/core/calamity';

const { EAtomKind, ETarget } = LucidShared;

const event = (cellId: number, value: number): LucidShared.TEvent => ({
  cellId,
  title: `Событие ${cellId}`,
  text: 'Текст',
  options: [{ text: 'Вариант', success: { atoms: [{ kind: EAtomKind.RESOURCE, target: ETarget.SELF, value }] } }],
});

describe('беда', () => {
  it('беда — ни один вариант не даёт плюса себе', () => {
    expect(isCalamity(event(1, -2))).toBe(true);
    expect(isCalamity(event(1, 2))).toBe(false);
  });

  it('плюс другим игрокам беду не отменяет', () => {
    const helpsLast: LucidShared.TEvent = {
      ...event(1, -2),
      options: [{ text: 'В', success: { atoms: [{ kind: EAtomKind.MOVE, target: ETarget.LAST, value: 2 }] } }],
    };

    expect(isCalamity(helpsLast)).toBe(true);
  });

  it('вытянутая беда открывает свою клетку', () => {
    const drawn = drawEvent(makeG({ events: { 2: event(2, -2), 3: event(3, 2) } }), 'bad');

    expect(drawn.cellId).toBe(2);
    expect(drawn.G.visited).toContain(2);
  });

  it('беды в партии нет — тянуть нечего', () => {
    const drawn = drawEvent(makeG({ events: { 3: event(3, 2) } }), 'bad');

    expect(drawn.cellId).toBeUndefined();
  });
});
