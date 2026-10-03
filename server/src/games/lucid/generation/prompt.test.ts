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
  calamity: false,
  paid: false,
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

  it('у беды в строке клетки — требование меньшего зла, платного без пометки нет', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell({ calamity: true })], []);

    expect(prompt).toContain('завязка: находка (беда — все варианты с потерей');
    expect(prompt).not.toContain('(один вариант платный');
  });

  it('у платного в строке клетки — пометка cost без threshold', () => {
    const line = buildEventsPrompt('Подземелье', 'золото', [cell({ paid: true })], [])
      .split('\n')
      .find(row => row.startsWith('- клетка 43'));

    expect(line).toContain('(один вариант платный — cost, без threshold)');
    expect(line).not.toContain('беда');
  });

  it('беда и платный могут стоять на одной клетке, после требования к лидеру', () => {
    const line = buildEventsPrompt('Подземелье', 'золото', [cell({ calamity: true, paid: true })], [])
      .split('\n')
      .find(row => row.startsWith('- клетка 43'));

    expect(line).toContain('(беда');
    expect(line).toContain('(один вариант платный');
  });

  it('предупреждает не повторять завязку дословно как заголовок', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], []);

    expect(prompt).toContain('не повторяй её название дословно');
  });

  it('просит короткие тексты события и варианта', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], []);

    expect(prompt).toContain('до 140 символов');
    expect(prompt).toContain('до 50 символов');
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
