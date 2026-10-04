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
  it('нераскрытое событие — полый ромб со знаком вопроса', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, false)).toEqual({ shape: 'diamond', fill: 'hollow', label: '?' });
  });

  it('посещённое событие — залитый ромб без знака', () => {
    expect(cellLook({ id: 1, type: ECellType.EVENT, next: [] }, true)).toEqual({ shape: 'diamond', fill: 'ink' });
  });

  it('пустая клетка — точка, залитая после посещения', () => {
    expect(cellLook({ id: 1, type: ECellType.EMPTY, next: [] }, false)).toEqual({ shape: 'dot', fill: 'hollow' });
    expect(cellLook({ id: 1, type: ECellType.EMPTY, next: [] }, true)).toEqual({ shape: 'dot', fill: 'ink' });
  });

  it('красная и зелёная — круг своего цвета независимо от посещения', () => {
    [false, true].forEach(isVisited => {
      const red = cellLook({ id: 1, type: ECellType.RED, next: [] }, isVisited);
      const green = cellLook({ id: 1, type: ECellType.GREEN, next: [] }, isVisited);

      expect(red).toMatchObject({ shape: 'disc', icon: 'RED' });
      expect(green).toMatchObject({ shape: 'disc', icon: 'GREEN' });
      expect(red.fill).toMatch(/^#/);
      expect(green.fill).not.toBe(red.fill);
    });
  });

  it('клетка «Закон» видна сразу — шестиугольник с весами', () => {
    expect(cellLook({ id: 1, type: ECellType.LAW, next: [] }, false)).toEqual({ shape: 'hex', fill: LAW_FILL, icon: 'LAW' });
  });

  it('клетка «Лавка» видна сразу — домик с сумкой', () => {
    expect(cellLook({ id: 1, type: ECellType.SHOP, next: [] }, false)).toEqual({ shape: 'house', fill: SHOP_FILL, icon: 'SHOP' });
    expect(SHOP_FILL).toBe('#3f7cc4');
  });

  it('портал — кольцо цвета пары с её номером, у пар разные цвета', () => {
    const first = cellLook({ id: 1, type: ECellType.PORTAL, next: [], portal: { pair: 0, to: 5 } }, false);
    const second = cellLook({ id: 2, type: ECellType.PORTAL, next: [], portal: { pair: 1, to: 6 } }, false);

    expect(first.shape).toBe('portal');
    expect(first.label).toBe('1');
    expect(second.label).toBe('2');
    expect(first.fill).not.toBe(second.fill);
  });

  it('старт и финиш — плитка с флагом и сейфом', () => {
    expect(cellLook({ id: 1, type: ECellType.START, next: [] }, true)).toEqual({ shape: 'tile', fill: 'ink', icon: 'START' });
    expect(cellLook({ id: 1, type: ECellType.FINISH, next: [] }, false)).toEqual({ shape: 'tile', fill: 'hollow', icon: 'FINISH' });
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
