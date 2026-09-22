import {
  describe,
  expect,
  it,
} from 'vitest';

import { regionForDepth, resolveRegions } from '@/lib/lucid/regions';
import { contrastRatio, parseHex } from '@/lib/lucid/colors';

const named = (names: string[]) => names.map(name => ({ name, color: '#415a77' }));

// Цвета краёв приходят от модели, и она вернёт такое рано или поздно
const hostile: Record<string, string[]> = {
  'одинаковые': ['#7a6f63', '#7a6f63', '#7a6f63'],
  'чёрные': ['#000000', '#010101', '#000000'],
  'белые': ['#ffffff', '#fefefe', '#ffffff'],
  'мусор вместо цвета': ['не цвет', '', '#4f7942'],
  'кислотные': ['#00ff00', '#ff00ff', '#00ffff'],
};

const bases = ['#0d1b2a', '#f6f4ef', '#808080'];

describe('края мира', () => {
  describe('раскладка по длине пути', () => {
    const regions = named(['Соляные пустоши', 'Машинный зал', 'Оранжерея']);

    it('начало пути — в первом крае, конец — в последнем', () => {
      expect(regionForDepth(regions, 0, 15)?.name).toBe('Соляные пустоши');
      expect(regionForDepth(regions, 15, 15)?.name).toBe('Оранжерея');
    });

    it('делит путь на равные отрезки', () => {
      const names = Array.from({ length: 16 }, (_, depth) => regionForDepth(regions, depth, 15)?.name);

      expect(names.filter(name => name === 'Соляные пустоши')).toHaveLength(6);
      expect(names.filter(name => name === 'Машинный зал')).toHaveLength(5);
      expect(names.filter(name => name === 'Оранжерея')).toHaveLength(5);
    });

    it('не выходит за край списка на глубине больше длины пути', () => {
      expect(regionForDepth(regions, 40, 15)?.name).toBe('Оранжерея');
    });

    it('без краёв возвращает ничего: партия из базы старше правки', () => {
      expect(regionForDepth([], 3, 15)).toBeUndefined();
    });
  });

  describe('цвета краёв', () => {
    bases.forEach(base => {
      Object.entries(hostile).forEach(([name, colors]) => {
        it(`держит читаемость на основе ${base}: ${name}`, () => {
          const baseRgb = parseHex(base)!;

          resolveRegions(colors.map(color => ({ name: 'Край', color })), base).forEach(region => {
            expect(contrastRatio(parseHex(region.ribbon)!, baseRgb)).toBeGreaterThanOrEqual(3);
            expect(contrastRatio(parseHex(region.ink)!, baseRgb)).toBeGreaterThanOrEqual(4.5);
          });
        });
      });
    });

    it('держит читаемость, когда край покрашен в цвет основы', () => {
      const base = '#0d1b2a';
      const baseRgb = parseHex(base)!;
      const [region] = resolveRegions([{ name: 'Край', color: base }], base);

      expect(contrastRatio(parseHex(region.ribbon)!, baseRgb)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(parseHex(region.ink)!, baseRgb)).toBeGreaterThanOrEqual(4.5);
    });

    it('сохраняет названия и их порядок', () => {
      const resolved = resolveRegions(named(['Первый', 'Второй']), '#0d1b2a');

      expect(resolved.map(region => region.name)).toEqual(['Первый', 'Второй']);
    });
  });
});
