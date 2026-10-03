import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { cellLook, zoneStarts } from './cellLook';

const ECellType = LucidShared.ECellType;

describe('cellLook', () => {
  it('нераскрытое событие — полая плитка со знаком вопроса', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, false)).toEqual({ fill: 'hollow', glyph: '?' });
  });

  it('посещённое событие — залитая плитка без знака', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, true)).toEqual({ fill: 'ink' });
  });

  it('красная и зелёная — свой цвет независимо от посещения', () => {
    [false, true].forEach(isVisited => {
      expect(cellLook({ id: 1, type: ECellType.RED, next: [] }, isVisited).fill).toMatch(/^#/);
      expect(cellLook({ id: 1, type: ECellType.GREEN, next: [] }, isVisited).fill).toMatch(/^#/);
    });
  });

  it('портал — кольцо цвета своей пары, у пар разные цвета', () => {
    const first = cellLook({ id: 1, type: ECellType.PORTAL, next: [], portal: { pair: 0, to: 5 } }, false);
    const second = cellLook({ id: 2, type: ECellType.PORTAL, next: [], portal: { pair: 1, to: 6 } }, false);

    expect(first.ring).toBeDefined();
    expect(first.ring).not.toBe(second.ring);
  });
});

describe('zoneStarts', () => {
  it('отмечает первую клетку зон «выбор» и «сумма»', () => {
    const cells = Array.from({ length: 31 }, (_, id) => ({
      id,
      type: ECellType.EMPTY,
      next: id === 30 ? [] : [id + 1],
    }));
    const track = { cells, startId: 0, finishId: 30 };
    const starts = zoneStarts(track);

    expect(starts.map(start => start.zone)).toEqual([LucidShared.EDiceZone.PICK, LucidShared.EDiceZone.SUM]);
    starts.forEach(start => {
      expect(LucidShared.diceZoneForDepth(start.cellId - 1, 30)).not.toBe(start.zone);
      expect(LucidShared.diceZoneForDepth(start.cellId, 30)).toBe(start.zone);
    });
  });
});
