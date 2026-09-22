import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildEventsPrompt } from '@/games/lucid/generation/prompt';

describe('buildEventsPrompt', () => {
  it('должен разделять количество событий и номера клеток', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [43], []);

    expect(prompt).toContain('Количество событий: 1');
    expect(prompt).toContain('43');
  });

  it('передаёт роли игроков как контекст, не привязывая событие к конкретному', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [43], [
      { nickname: 'Джек', role: 'хранитель компаса' },
    ]);

    expect(prompt).toContain('Джек — хранитель компаса');
    expect(prompt).toContain('любому');
  });

  it('без ролей не оставляет в промпте пустой абзац', () => {
    expect(buildEventsPrompt('Подземелье', 'золото', [43], [])).not.toContain('роли игроков');
  });
});
