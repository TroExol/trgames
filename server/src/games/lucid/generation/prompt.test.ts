import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildEventsPrompt } from '@/games/lucid/generation/prompt';

describe('buildEventsPrompt', () => {
  it('должен разделять количество событий и номера клеток', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [43]);

    expect(prompt).toContain('Количество событий: 1');
    expect(prompt).toContain('43');
  });
});
