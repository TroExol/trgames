import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import type { TEventCellBrief } from '@/games/lucid/generation/prompt';

import {
  buildEventsPrompt,
  buildWorldPrompt,
  PROMPT_CARD_IDS,
} from '@/games/lucid/generation/prompt';

const cell = (overrides: Partial<TEventCellBrief> = {}): TEventCellBrief => ({
  cellId: 43,
  premise: 'находка',
  region: 'Подземный зал',
  calamity: false,
  paid: false,
  chosen: false,
  ...overrides,
});

describe('buildWorldPrompt', () => {
  it('не просит ролей игроков', () => {
    const prompt = buildWorldPrompt('пираты');

    expect(prompt).not.toContain('roles');
    expect(prompt).not.toContain('роль');
    expect(prompt).toContain('одно слово');
  });

  it('просит строку карты шутить о ситуации, а не пересказывать правило', () => {
    const prompt = buildWorldPrompt('пираты');

    expect(prompt).toContain('flavor шутит о ситуации карты');
    expect(prompt).toContain('ироничный рассказчик');
  });

  it('запрещает ключи схемы и слово «ресурс» в названиях и строках карт', () => {
    const prompt = buildWorldPrompt('пираты');

    expect(prompt).toContain('не пиши ключи вроде FIRST, LAST и слово');
  });
});

describe('buildEventsPrompt', () => {
  it('задаёт тон: ироничный рассказчик, юмор в духе темы', () => {
    const prompt = buildEventsPrompt('Подземелье', 'заряды', [cell()], []);

    expect(prompt).toContain('ироничный рассказчик');
    expect(prompt).toContain('мрачный мир — чёрный юмор');
  });

  it('просит называть цели словами и ресурс — названием темы', () => {
    const prompt = buildEventsPrompt('Подземелье', 'заряды', [cell()], []);

    expect(prompt).toContain('не пиши ключи схемы');
    expect(prompt).toContain('«заряды» в нужном падеже, слово «ресурс» не пиши');
  });

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

  it('у выбора игрока в строке клетки — требование атома на CHOSEN, цель описана', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell({ chosen: true })], []);

    expect(prompt).toContain('(хотя бы один вариант с атомом на CHOSEN — ходящий выберет, кому помочь или помешать)');
    expect(prompt).toContain('- CHOSEN: игрок, которого выберет ходящий (не он сам)');
    expect(buildEventsPrompt('Подземелье', 'золото', [cell()], [])).not.toContain('(хотя бы один вариант с атомом на CHOSEN');
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

  it('передаёт ники игроков как контекст, не привязывая событие к конкретному', () => {
    const prompt = buildEventsPrompt('Подземелье', 'золото', [cell()], ['Джек', 'Аня']);

    expect(prompt).toContain('В партии играют: Джек, Аня.');
    expect(prompt).toContain('любому');
    expect(prompt).not.toContain('роль');
    expect(prompt).not.toContain('роли');
  });

  it('без ников не оставляет в промпте пустой абзац', () => {
    expect(buildEventsPrompt('Подземелье', 'золото', [cell()], [])).not.toContain('В партии играют');
  });
});

describe('buildWorldPrompt: названия карт', () => {
  it('требует cards и перечисляет 25 карт под безликими ключами', () => {
    const prompt = buildWorldPrompt('пираты');

    expect(PROMPT_CARD_IDS).toHaveLength(25);
    expect(prompt).toContain('"cards":[{"id":"card1"');
    expect(prompt).toContain('- card1: ');
    expect(prompt).toContain('- card25: ');
    PROMPT_CARD_IDS.forEach(id => expect(prompt).not.toMatch(new RegExp(`\\b${id}\\b`)));
  });
});
