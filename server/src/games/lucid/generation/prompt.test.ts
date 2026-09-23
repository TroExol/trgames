import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import type { TEventCellBrief } from '@/games/lucid/generation/prompt';

import { buildEventsPrompt, buildWorldPrompt } from '@/games/lucid/generation/prompt';

const cell = (overrides: Partial<TEventCellBrief> = {}): TEventCellBrief => ({
  cellId: 43,
  premise: 'находка',
  region: 'Подземный зал',
  ...overrides,
});

describe('buildWorldPrompt', () => {
  it('просит роли игроков и перечисляет ники, для которых их нужно придумать', () => {
    const prompt = buildWorldPrompt('пираты', ['Аня', 'Боря']);

    expect(prompt).toContain('"roles":[{"nickname"');
    expect(prompt).toContain('Имена игроков: Аня, Боря.');
  });
});

describe('buildEventsPrompt', () => {
  it('строит строку на клетку с краем и завязкой, без требования у обычной завязки', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], []);

    expect(prompt).toContain('Количество событий: 1');
    expect(prompt).toContain('- клетка 43 — край «Подземный зал», завязка: находка');
    expect(prompt).not.toContain('находка (');
  });

  it('у завязки «удар по лидеру» требует атом на FIRST', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [
      cell({ premise: 'удар по лидеру', target: LucidShared.ETarget.FIRST }),
    ], []);

    expect(prompt).toContain('завязка: удар по лидеру (хотя бы один вариант с атомом на FIRST');
  });

  it('у завязки «помощь отстающему» требует атом на LAST', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [
      cell({ premise: 'помощь отстающему', target: LucidShared.ETarget.LAST }),
    ], []);

    expect(prompt).toContain('завязка: помощь отстающему (хотя бы один вариант с атомом на LAST');
  });

  it('предупреждает не повторять завязку дословно как заголовок', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], []);

    expect(prompt).toContain('не повторяй её название дословно');
  });

  it('передаёт роли игроков как контекст, не привязывая событие к конкретному', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], [
      { nickname: 'Джек', role: 'хранитель компаса' },
    ]);

    expect(prompt).toContain('Джек — хранитель компаса');
    expect(prompt).toContain('любому');
  });

  it('без ролей не оставляет в промпте пустой абзац', () => {
    expect(buildEventsPrompt('Подземелье', 'золото', [cell()], [])).not.toContain('роли игроков');
  });
});
