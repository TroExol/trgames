import {
  describe,
  expect,
  it,
} from 'vitest';

import { linkPath } from './linkPath';

const cell = (x: number, y: number, col = 0) => ({ x, y, col });

describe('линия трека', () => {
  it('идёт прямо внутри ряда', () => {
    expect(linkPath(cell(50, 60), cell(150, 60))).toBe('M50 60H150');
  });

  it('поворачивает на 45 градусов при сходе на прядь', () => {
    const path = linkPath(cell(50, 60), cell(150, 94));

    // Сначала горизонтально, затем диагональ ровно на 45 градусов
    expect(path).toBe('M50 60H116L150 94');
  });

  it('разворачивается в конце ряда без вертикального излома', () => {
    const path = linkPath(cell(750, 60, 7), cell(750, 180, 7));

    expect(path.startsWith('M750 60')).toBe(true);
    expect(path).toContain('V');
  });

  it('не падает на совпадающих точках', () => {
    expect(() => linkPath(cell(50, 60), cell(50, 60))).not.toThrow();
  });
});
