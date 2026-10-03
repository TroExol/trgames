import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { computeContentMetrics } from '@/games/lucid/generation/contentMetrics';

const atom = (
  kind: LucidShared.EAtomKind,
  target: LucidShared.ETarget,
  value = 0,
): LucidShared.TAtom => ({ kind, target, value });

const option = (
  partial: { success: LucidShared.TEffect } & Partial<LucidShared.TOption>,
): LucidShared.TOption => ({ text: 'вариант', ...partial });

const event = (cellId: number, options: LucidShared.TOption[]): LucidShared.TEvent => ({
  cellId,
  title: 'Событие',
  text: 'Описание',
  options,
});

const content = (events: LucidShared.TEvent[]): LucidShared.TPartyContent => ({
  theme: { name: 'Мир', resourceName: 'ресурс', palette: ['#111111'] },
  events: events.reduce<Record<number, LucidShared.TEvent>>(
    (acc, item) => ({ ...acc, [item.cellId]: item }),
    {},
  ),
});

describe('computeContentMetrics', () => {
  it('на партии без событий все доли нулевые', () => {
    expect(computeContentMetrics(content([]))).toEqual({
      paidOptionShare: 0,
      antiLeaderShare: 0,
      helpLastShare: 0,
      calamityShare: 0,
      avgEventTextLength: 0,
      avgOptionTextLength: 0,
    });
  });

  it('платный вариант учитывается в доле, бесплатный — нет', () => {
    const paid = event(1, [
      option({ cost: 2, success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)] } }),
    ]);
    const free = event(2, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)] } }),
    ]);

    expect(computeContentMetrics(content([paid, free])).paidOptionShare).toBe(0.5);
  });

  it('сдвиг лидера назад и минус его ресурса считаются вредом', () => {
    const movedBack = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.FIRST, -2)] } }),
    ]);
    const resourceHit = event(2, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.FIRST, -1)] } }),
    ]);

    expect(computeContentMetrics(content([movedBack, resourceHit])).antiLeaderShare).toBe(1);
  });

  it('пропуск хода лидером и обмен с лидером тоже считаются вредом', () => {
    const skip = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.SKIP_TURN, LucidShared.ETarget.FIRST, 1)] } }),
    ]);
    // У SWAP_WITH_FIRST цель обычно SELF — вред лидеру не зависит от target
    const swap = event(2, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.SWAP_WITH_FIRST, LucidShared.ETarget.SELF)] } }),
    ]);

    expect(computeContentMetrics(content([skip, swap])).antiLeaderShare).toBe(1);
  });

  it('сдвиг лидера вперёд вредом не считается', () => {
    const helped = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.FIRST, 2)] } }),
    ]);

    expect(computeContentMetrics(content([helped])).antiLeaderShare).toBe(0);
  });

  it('сдвиг последнего вперёд и плюс его ресурса считаются помощью', () => {
    const movedUp = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.LAST, 2)] } }),
    ]);
    const resourceUp = event(2, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.LAST, 1)] } }),
    ]);

    expect(computeContentMetrics(content([movedUp, resourceUp])).helpLastShare).toBe(1);
  });

  it('сдвиг последнего назад помощью не считается', () => {
    const hurt = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.LAST, -2)] } }),
    ]);

    expect(computeContentMetrics(content([hurt])).helpLastShare).toBe(0);
  });

  it('эффект считается и в otherwise условия, и в failure варианта', () => {
    const inOtherwise = event(1, [
      option({
        success: {
          atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)],
          condition: {
            field: LucidShared.EConditionField.POSITION,
            operator: LucidShared.EConditionOperator.GT,
            value: 3,
          },
          otherwise: [atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.LAST, 2)],
        },
      }),
    ]);
    const inFailure = event(2, [
      option({
        success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 1)] },
        failure: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.LAST, 3)] },
      }),
    ]);

    expect(computeContentMetrics(content([inOtherwise, inFailure])).helpLastShare).toBe(1);
  });

  it('беда — когда ни одна ветка ни одного варианта не даёт чистого плюса ходящему', () => {
    const calamity = event(1, [
      option({
        threshold: 4,
        success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, -1)] },
        failure: { atoms: [atom(LucidShared.EAtomKind.SKIP_TURN, LucidShared.ETarget.SELF, 1)] },
      }),
      option({ cost: 2, success: { atoms: [atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.SELF, -1)] } }),
    ]);
    const gainInSuccess = event(2, [
      option({
        threshold: 4,
        success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 2)] },
        failure: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, -2)] },
      }),
    ]);
    const gainInOtherwise = event(3, [
      option({
        success: {
          atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, -1)],
          condition: {
            field: LucidShared.EConditionField.RESOURCE,
            operator: LucidShared.EConditionOperator.GT,
            value: 1,
          },
          otherwise: [atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.ALL, 1)],
        },
      }),
    ]);
    const noOptions = event(4, []);

    expect(computeContentMetrics(content([calamity, gainInSuccess, gainInOtherwise, noOptions])).calamityShare)
      .toBe(0.25);
  });

  it('плюс другому игроку бедой быть не мешает', () => {
    const calamity = event(1, [
      option({ success: { atoms: [atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.LAST, 2)] } }),
    ]);

    expect(computeContentMetrics(content([calamity])).calamityShare).toBe(1);
  });

  it('считает среднюю длину текста события и варианта', () => {
    const first = { ...event(1, [option({ text: 'abcd', success: { atoms: [] } })]), text: '12345678' };
    const second = { ...event(2, [option({ text: 'ab', success: { atoms: [] } })]), text: '1234' };

    const metrics = computeContentMetrics(content([first, second]));

    expect(metrics.avgEventTextLength).toBe(6);
    expect(metrics.avgOptionTextLength).toBe(3);
  });
});
