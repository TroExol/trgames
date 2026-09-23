import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { walkPath } from '@/lib/lucid/walkPath';

const START = 'START' as LucidShared.ECellType;
const EVENT = 'EVENT' as LucidShared.ECellType;
const FINISH = 'FINISH' as LucidShared.ECellType;

// 0 → 1 → 2 → 3 → 4 (финиш)
const lineTrack = (): LucidShared.TTrack => ({
  cells: [
    { id: 0, type: START, next: [1] },
    { id: 1, type: EVENT, next: [2] },
    { id: 2, type: EVENT, next: [3] },
    { id: 3, type: EVENT, next: [4] },
    { id: 4, type: FINISH, next: [] },
  ],
  startId: 0,
  finishId: 4,
});

// 0 → 1, дальше развилка на 2→3 и 4→5, сходятся в 6
const forkTrack = (): LucidShared.TTrack => ({
  cells: [
    { id: 0, type: START, next: [1] },
    { id: 1, type: EVENT, next: [2, 4] },
    { id: 2, type: EVENT, next: [3] },
    { id: 3, type: EVENT, next: [6] },
    { id: 4, type: EVENT, next: [5] },
    { id: 5, type: EVENT, next: [6] },
    { id: 6, type: FINISH, next: [] },
  ],
  startId: 0,
  finishId: 6,
});

describe('walkPath', () => {
  it('идёт по прямому участку клетка за клеткой', () => {
    expect(walkPath(lineTrack(), 0, 3)).toEqual([1, 2, 3]);
  });

  it('останавливается на клетке-развилке, не доходя до конца шагов', () => {
    expect(walkPath(forkTrack(), 0, 5)).toEqual([1]);
  });

  it('стоя уже на развилке, шага не делает', () => {
    expect(walkPath(forkTrack(), 1, 3)).toEqual([]);
  });

  it('останавливается в тупике (клетка без next)', () => {
    expect(walkPath(lineTrack(), 3, 5)).toEqual([4]);
  });

  it('ноль шагов — пустой путь', () => {
    expect(walkPath(lineTrack(), 0, 0)).toEqual([]);
  });
});
