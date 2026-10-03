import {
  describe,
  expect,
  it,
} from 'vitest';

import { themeStyle } from '@/lib/lucid/theme';
import {
  contrastRatio,
  deriveRoles,
  parseHex,
} from '@/lib/lucid/colors';

const roles = deriveRoles(['#0d1b2a', '#415a77', '#e0e1dd', '#f4a259']);

describe('оформление темы', () => {
  it('даёт одинаковый фон одному и тому же миру', () => {
    expect(themeStyle(roles, 'Заброшенная станция'))
      .toEqual(themeStyle(roles, 'Заброшенная станция'));
  });

  it('даёт разный фон разным мирам', () => {
    expect(themeStyle(roles, 'Заброшенная станция').backgroundImage)
      .not.toBe(themeStyle(roles, 'Пираты Карибского моря').backgroundImage);
  });

  it('объявляет переменные ролей', () => {
    const style = themeStyle(roles, 'Заброшенная станция') as Record<string, string>;

    expect(style['--lucid-base']).toBe(roles.base);
    expect(style['--lucid-text']).toBe(roles.text);
    expect(style['--lucid-accent']).toBe(roles.accent);
    expect(style['--lucid-line']).toBeDefined();
  });

  it('держит линию трека различимой на основе', () => {
    // Палитра, на которой самая бледная опора сливается с основой
    const light = deriveRoles(['#f6f4ef', '#e8dcc8', '#c0a080', '#1b2a41']);
    const style = themeStyle(light, 'Пираты Карибского моря') as Record<string, string>;

    expect(contrastRatio(parseHex(style['--lucid-line'])!, parseHex(light.base)!))
      .toBeGreaterThanOrEqual(3);
  });

  it('устойчив к пустому названию мира', () => {
    expect(() => themeStyle(roles, '')).not.toThrow();
  });
});
