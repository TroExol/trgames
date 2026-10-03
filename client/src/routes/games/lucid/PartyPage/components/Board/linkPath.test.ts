import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  linkMiddle,
  linkPath,
  tilePath,
} from './linkPath';

const cell = (x: number, y: number, col = 0) => ({ x, y, col });

describe('лента трека', () => {
  it('идёт гладкой кривой внутри ряда', () => {
    // Управляющие точки отнесены на половину горизонтальной разницы: пологая S
    expect(linkPath(cell(66, 100), cell(198, 88))).toBe('M66 100C132 100 132 88 198 88');
  });

  it('разворачивается в конце ряда широкой дугой наружу', () => {
    // Горизонтальной разницы нет, управляющие точки выносятся за край ряда
    expect(linkPath(cell(990, 98, 7), cell(990, 228, 7))).toBe('M990 98C1060 98 1060 228 990 228');
    expect(linkPath(cell(66, 98, 0), cell(66, 228, 0))).toBe('M66 98C-4 98 -4 228 66 228');
  });

  it('не падает на совпадающих точках', () => {
    expect(() => linkPath(cell(50, 60), cell(50, 60))).not.toThrow();
  });
});

describe('середина связи', () => {
  it('внутри ряда лежит посередине между клетками', () => {
    expect(linkMiddle(cell(66, 100), cell(198, 88))).toEqual({ x: 132, y: 94 });
  });

  it('на развороте вынесена за край ряда, как и сама дуга', () => {
    expect(linkMiddle(cell(990, 98, 7), cell(990, 228, 7))).toEqual({ x: 1042.5, y: 163 });
    expect(linkMiddle(cell(66, 98, 0), cell(66, 228, 0))).toEqual({ x: 13.5, y: 163 });
  });
});

describe('плитка', () => {
  it('без наклона — прямоугольник поперёк ленты', () => {
    expect(tilePath({ x: 100, y: 100, angle: 0 }, 36, 28))
      .toBe('M82 86L118 86L118 114L82 114Z');
  });

  it('повёрнута по ходу пути', () => {
    const tilted = tilePath({ x: 100, y: 100, angle: Math.PI / 2 }, 36, 28);

    expect(tilted).toBe('M114 82L114 118L86 118L86 82Z');
  });

  it('держит размеры сторон при любом наклоне', () => {
    const points = tilePath({ x: 100, y: 100, angle: 0.7 }, 36, 28)
      .replace(/[MLZ]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number);
    const side = (from: number, to: number): number =>
      Math.hypot(points[to * 2] - points[from * 2], points[to * 2 + 1] - points[from * 2 + 1]);

    expect(side(0, 1)).toBeCloseTo(36, 1);
    expect(side(1, 2)).toBeCloseTo(28, 1);
  });
});
