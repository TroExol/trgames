import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  sanitizeEvent,
  sanitizeTheme,
  stripSchemaKeys,
} from '@/games/lucid/generation/sanitize';

describe('stripSchemaKeys', () => {
  it('вырезает ключ посреди фразы вместе с лишним пробелом', () => {
    expect(stripSchemaKeys('В глубине камеры отстающий LAST застрял в жиле')).toBe(
      'В глубине камеры отстающий застрял в жиле',
    );
  });

  it('вырезает ключ в скобках целиком, без пустых скобок', () => {
    expect(stripSchemaKeys('Лидер (FIRST) теряет шаг')).toBe('Лидер теряет шаг');
    expect(stripSchemaKeys('Лидер (FIRST, LAST) теряет шаг')).toBe('Лидер теряет шаг');
    expect(stripSchemaKeys('Лидер ( ) теряет шаг')).toBe('Лидер теряет шаг');
  });

  it('вырезает ключ в начале и в конце, не оставляя пробела перед знаком', () => {
    expect(stripSchemaKeys('CHOSEN отступает назад.')).toBe('отступает назад.');
    expect(stripSchemaKeys('Игрок падает SELF, смеясь')).toBe('Игрок падает, смеясь');
  });

  it('вырезает составные названия атомов целиком', () => {
    expect(stripSchemaKeys('Обмен SWAP_WITH_FIRST случился')).toBe('Обмен случился');
    expect(stripSchemaKeys('Пропуск SKIP_TURN и MOVE RESOURCE')).toBe('Пропуск и');
  });

  it('не трогает обычные слова и нижний регистр', () => {
    expect(stripSchemaKeys('Small ball, all last first')).toBe('Small ball, all last first');
    expect(stripSchemaKeys('ALLY и FIRSTLY')).toBe('ALLY и FIRSTLY');
  });

  it('возвращает исходный текст, если после вырезания ничего не осталось', () => {
    expect(stripSchemaKeys('FIRST')).toBe('FIRST');
  });
});

describe('sanitizeEvent: text веток', () => {
  const atom = { kind: 'MOVE', target: 'SELF', value: 1 } as never;

  it('вырезает ключи схемы из text у success и failure', () => {
    const event = sanitizeEvent({
      cellId: 1,
      title: 'Т',
      text: 'Т',
      options: [{
        text: 'В',
        threshold: 3,
        success: { text: 'Лидер FIRST спотыкается', atoms: [atom] },
        failure: { text: 'Падает (LAST)', atoms: [atom] },
      }],
    });

    expect(event.options[0].success.text).toBe('Лидер спотыкается');
    expect(event.options[0].failure?.text).toBe('Падает');
  });

  it('не добавляет text и failure, если их не было', () => {
    const event = sanitizeEvent({
      cellId: 1,
      title: 'Т',
      text: 'Т',
      options: [{ text: 'В', success: { atoms: [atom] } }],
    });

    expect('text' in event.options[0].success).toBe(false);
    expect('failure' in event.options[0]).toBe(false);
  });
});

describe('sanitizeTheme: значки', () => {
  const base = { name: 'Мир', regions: [{ name: 'Край' }] };

  it('отбрасывает неизвестные значки и повторы', () => {
    expect(sanitizeTheme({ ...base, icons: ['anchor', 'nope', 'anchor', 'ship'] }).icons)
      .toEqual(['anchor', 'ship']);
  });

  it('убирает поле, если ничего не осталось', () => {
    expect('icons' in sanitizeTheme({ ...base, icons: ['nope'] })).toBe(false);
    expect('icons' in sanitizeTheme(base)).toBe(false);
  });
});
