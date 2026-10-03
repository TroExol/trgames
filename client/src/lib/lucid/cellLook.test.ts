import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  cellLook,
  LAW_FILL,
  SHOP_FILL,
  zoneStarts,
} from './cellLook';

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

  it('клетка «Закон» видна сразу и с глифом', () => {
    const look = cellLook({ id: 1, type: ECellType.LAW, next: [] }, false);

    expect(look).toEqual({ fill: LAW_FILL, glyph: '§' });
  });

  it('клетка «Лавка» видна сразу и с глифом', () => {
    expect(cellLook({ id: 1, type: ECellType.SHOP, next: [] }, false)).toEqual({ fill: SHOP_FILL, glyph: '¤' });
    expect(SHOP_FILL).toBe('#3f7cc4');
  });

  it('портал — кольцо цвета своей пары, у пар разные цвета', () => {
    const first = cellLook({ id: 1, type: ECellType.PORTAL, next: [], portal: { pair: 0, to: 5 } }, false);
    const second = cellLook({ id: 2, type: ECellType.PORTAL, next: [], portal: { pair: 1, to: 6 } }, false);

    expect(first.ring).toBeDefined();
    expect(first.ring).not.toBe(second.ring);
  });
});

describe('zoneStarts', () => {
  it('отмечает первую клетку зоны «выбор» один раз', () => {
    const cells = Array.from({ length: 31 }, (_, id) => ({
      id,
      type: ECellType.EMPTY,
      next: id === 30 ? [] : [id + 1],
    }));
    const track = { cells, startId: 0, finishId: 30 };
    const starts = zoneStarts(track);

    expect(starts.map(start => start.zone)).toEqual([LucidShared.EDiceZone.PICK]);
    starts.forEach(start => {
      expect(LucidShared.diceZoneForDepth(start.cellId - 1, 30)).not.toBe(start.zone);
      expect(LucidShared.diceZoneForDepth(start.cellId, 30)).toBe(start.zone);
    });
  });
});
