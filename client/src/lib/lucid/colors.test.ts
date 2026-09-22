import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  contrastRatio,
  deriveRoles,
  parseHex,
} from '@/lib/lucid/colors';

// Палитры, на которых наивный подбор ломается. Модель вернёт такое рано или поздно
const hostile: Record<string, string[]> = {
  'одинаковые цвета': ['#7a6f63', '#7a6f63', '#7a6f63'],
  'почти одинаковые': ['#7a6f63', '#7b7064', '#796e62', '#7a7165'],
  'только чёрные': ['#000000', '#050505', '#0a0a0a'],
  'только белые': ['#ffffff', '#fefefe', '#fafafa'],
  'кислотные': ['#00ff00', '#ff00ff', '#00ffff', '#ffff00'],
  'три цвета': ['#1b2a41', '#c0a080', '#e4e9f0'],
  'шесть цветов': ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd', '#f4a259'],
  'серая середина': ['#7f7f7f', '#808080', '#818181'],
};

describe('роли цвета', () => {
  Object.entries(hostile).forEach(([name, palette]) => {
    it(`держит читаемость: ${name}`, () => {
      const roles = deriveRoles(palette);
      const base = parseHex(roles.base)!;

      expect(contrastRatio(parseHex(roles.text)!, base)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(parseHex(roles.accent)!, base)).toBeGreaterThanOrEqual(3);
    });
  });

  it('держит читаемость на пустой палитре', () => {
    const roles = deriveRoles([]);
    const base = parseHex(roles.base)!;

    expect(contrastRatio(parseHex(roles.text)!, base)).toBeGreaterThanOrEqual(4.5);
  });

  it('пропускает мусор в палитре', () => {
    const roles = deriveRoles(['не цвет', '#1b2a41', '', '#e4e9f0']);

    expect(parseHex(roles.base)).not.toBeNull();
  });

  it('тёмная тема берёт тёмную основу, светлая — светлую', () => {
    const palette = ['#0d1b2a', '#778da9', '#f4f4f5'];

    expect(deriveRoles(palette, 'DARK').base.toLowerCase()).toBe('#0d1b2a');
    expect(deriveRoles(palette, 'LIGHT').base.toLowerCase()).toBe('#f4f4f5');
  });

  it('без указания настроения решает средняя светлота', () => {
    expect(deriveRoles(['#0d1b2a', '#1b263b', '#415a77']).isDark).toBe(true);
    expect(deriveRoles(['#f4f4f5', '#e4e9f0', '#c0a080']).isDark).toBe(false);
  });

  it('опоры не пусты', () => {
    expect(deriveRoles(['#0d1b2a', '#778da9', '#f4a259']).supports.length).toBeGreaterThan(0);
  });
});
