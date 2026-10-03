import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  cellsPerRowFor,
  depthCount,
  layoutTrack,
} from '@/lib/lucid/trackLayout';

const START = 'START' as LucidShared.ECellType;
const EVENT = 'EVENT' as LucidShared.ECellType;
const FINISH = 'FINISH' as LucidShared.ECellType;

// Прямой трек без развилок
const lineTrack = (length: number): LucidShared.TTrack => ({
  cells: Array.from({ length }, (_, id) => ({
    id,
    type: id === 0 ? START : id === length - 1 ? FINISH : EVENT,
    next: id === length - 1 ? [] : [id + 1],
  })),
  startId: 0,
  finishId: length - 1,
});

// Трек с одной развилкой: две ветки по две клетки, сходящиеся в финише
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

describe('укладка трека', () => {
  it('укладывает все клетки', () => {
    const layout = layoutTrack(lineTrack(30), 8);

    expect(layout.cells).toHaveLength(30);
    expect(Object.keys(layout.byId)).toHaveLength(30);
  });

  it('не ставит две клетки в одну точку', () => {
    const layout = layoutTrack(forkTrack(), 4);
    const points = layout.cells.map(cell => `${cell.x}:${cell.y}`);

    expect(new Set(points).size).toBe(points.length);
  });

  it('ведёт змейку в обратную сторону на нечётных рядах', () => {
    const layout = layoutTrack(lineTrack(10), 4);

    expect(layout.byId[0].col).toBe(0);
    expect(layout.byId[3].col).toBe(3);
    // Пятая клетка уже в следующем ряду и идёт справа налево
    expect(layout.byId[4].row).toBe(1);
    expect(layout.byId[4].col).toBe(3);
  });

  it('разводит ветки развилки по разные стороны линии', () => {
    const layout = layoutTrack(forkTrack(), 8);

    expect(layout.byId[2].strand).not.toBe(layout.byId[4].strand);
    expect(layout.byId[2].depth).toBe(layout.byId[4].depth);
    expect(layout.byId[1].strand).toBe(0);
  });

  it('сводит ветки обратно к общей клетке', () => {
    const layout = layoutTrack(forkTrack(), 8);

    expect(layout.byId[6].strand).toBe(0);
    expect(layout.byId[6].depth).toBe(layout.byId[3].depth + 1);
  });

  it('связи ведут только между соседними по глубине клетками', () => {
    const layout = layoutTrack(forkTrack(), 8);

    layout.links.forEach(link => {
      expect(layout.byId[link.to].depth - layout.byId[link.from].depth).toBe(1);
    });
  });

  it('число рядов растёт при узкой раскладке', () => {
    expect(layoutTrack(lineTrack(30), 4).rows)
      .toBeGreaterThan(layoutTrack(lineTrack(30), 10).rows);
  });

  it('считает глубину пути: пряди развилки делят одну глубину', () => {
    expect(depthCount(lineTrack(30))).toBe(30);
    expect(depthCount(forkTrack())).toBe(5);
  });
});

describe('изгиб пути', () => {
  it('уводит клетки ряда с одной прямой', () => {
    const { cells } = layoutTrack(lineTrack(10), 5, 12345);
    const firstRow = cells.filter(cell => cell.row === 0);

    expect(new Set(firstRow.map(cell => cell.y)).size).toBeGreaterThan(1);
  });

  it('одинаков при одном сиде и разный при разных: изгиб от названия мира', () => {
    const ys = (seed: number) => layoutTrack(lineTrack(10), 5, seed).cells.map(cell => cell.y);

    expect(ys(12345)).toEqual(ys(12345));
    expect(ys(12345)).not.toEqual(ys(777));
  });

  it('поворачивает плитку по ходу пути', () => {
    const { byId } = layoutTrack(lineTrack(10), 5, 12345);

    // Внутри ряда путь идёт слева направо с наклоном, на развороте — вниз
    expect(Math.abs(byId[1].angle)).toBeGreaterThan(0);
    expect(Math.abs(byId[1].angle)).toBeLessThan(Math.PI / 4);
    expect(byId[4].angle).toBeGreaterThan(Math.PI / 4);
  });
});

describe('подбор числа клеток в ряду', () => {
  it('держится в пределах от четырёх до четырнадцати', () => {
    [[320, 2000], [4000, 200], [0, 0], [360, 640]].forEach(([width, height]) => {
      const perRow = cellsPerRowFor(width, height, 40);

      expect(perRow).toBeGreaterThanOrEqual(4);
      expect(perRow).toBeLessThanOrEqual(14);
    });
  });

  it('на узком высоком контейнере рядов больше, чем на широком низком', () => {
    const narrow = cellsPerRowFor(360, 900, 40);
    const wide = cellsPerRowFor(1440, 700, 40);

    expect(Math.ceil(40 / narrow)).toBeGreaterThan(Math.ceil(40 / wide));
  });

  it('не делит на ноль на коротком пути и пустом контейнере', () => {
    expect(Number.isFinite(cellsPerRowFor(0, 0, 1))).toBe(true);
    expect(Number.isFinite(cellsPerRowFor(1440, 0, 0))).toBe(true);
  });
});
