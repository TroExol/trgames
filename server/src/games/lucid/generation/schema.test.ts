import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  eventBatchSchema,
  eventSchema,
  worldSchema,
} from '@/games/lucid/generation/schema';

const validEvent = {
  cellId: 3,
  title: 'Кислотное болото',
  text: 'Тебя затянуло по пояс',
  options: [
    {
      text: 'Выбираться самому',
      threshold: 4,
      success: {
        atoms: [{
          kind: LucidShared.EAtomKind.MOVE,
          target: LucidShared.ETarget.SELF,
          value: 2,
        }],
      },
      failure: {
        atoms: [{
          kind: LucidShared.EAtomKind.SKIP_TURN,
          target: LucidShared.ETarget.SELF,
          value: 1,
        }],
      },
    },
  ],
};

const withAtoms = (atoms: unknown[]) => ({
  ...validEvent,
  options: [{ ...validEvent.options[0], success: { atoms } }],
});

// Фабрика, а не константа: проверки правят поля темы, и общий объект утаскивал
// бы правку в соседние тесты
const validWorld = (): { theme: LucidShared.TTheme } => ({
  theme: {
    name: 'Пираты Карибского моря',
    resourceName: 'дублоны',
    palette: ['#102030', '#405060', '#708090', '#a0b0c0', '#d0e0f0'],
    regions: [
      { name: 'Бухта висельников', color: '#102030' },
      { name: 'Пальмовый берег', color: '#a0b0c0' },
      { name: 'Пороховой трюм', color: '#405060' },
    ],
  },
});

describe('eventSchema', () => {
  it('принимает корректное событие', () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it('отклоняет порог кубика вне диапазона', () => {
    const invalid = { ...validEvent, options: [{ ...validEvent.options[0], threshold: 7 }] };

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет неизвестный вид атома', () => {
    const invalid = withAtoms([{ kind: 'EXPLODE', target: LucidShared.ETarget.SELF, value: 1 }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет значение вне диапазона своего вида атома', () => {
    const invalid = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: 99,
    }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет отрицательный пропуск хода, хотя для сдвига минус допустим', () => {
    const negativeSkip = withAtoms([{
      kind: LucidShared.EAtomKind.SKIP_TURN,
      target: LucidShared.ETarget.SELF,
      value: -1,
    }]);
    const negativeMove = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: -1,
    }]);

    expect(eventSchema.safeParse(negativeSkip).success).toBe(false);
    expect(eventSchema.safeParse(negativeMove).success).toBe(true);
  });

  it('отклоняет лишние поля внутри атома', () => {
    const invalid = withAtoms([{
      kind: LucidShared.EAtomKind.MOVE,
      target: LucidShared.ETarget.SELF,
      value: 1,
      condition: { nested: true },
    }]);

    expect(eventSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('worldSchema', () => {
  it('принимает корректную тему', () => {
    const result = worldSchema.safeParse(validWorld());

    expect(result.success).toBe(true);
  });

  it('принимает тему с настроением', () => {
    const world = validWorld();

    world.theme.mood = LucidShared.EThemeMood.DARK;

    expect(worldSchema.safeParse(world).success).toBe(true);
  });

  it('отклоняет неизвестное настроение', () => {
    const world = validWorld();

    expect(worldSchema.safeParse({
      ...world,
      theme: { ...world.theme, mood: 'SPOOKY' },
    }).success).toBe(false);
  });

  it('отклоняет палитру неверного формата', () => {
    const world = validWorld();

    expect(worldSchema.safeParse({
      ...world,
      theme: { ...world.theme, palette: ['красный'] },
    }).success).toBe(false);
  });

  it('принимает мир с пятью краями', () => {
    const world = validWorld();

    world.theme.regions = [
      { name: 'Соляные пустоши', color: '#c9b79c' },
      { name: 'Машинный зал', color: '#415a77' },
      { name: 'Оранжерея', color: '#4f7942' },
      { name: 'Шлюзовой отсек', color: '#1f2937' },
      { name: 'Реакторный блок', color: '#f59e0b' },
    ];

    expect(worldSchema.safeParse(world).success).toBe(true);
  });

  it('требует края: без требования в схеме модель их не вернёт', () => {
    const { theme } = validWorld();

    delete theme.regions;

    expect(worldSchema.safeParse({ theme }).success).toBe(false);
  });

  it('отвергает край с кривым цветом', () => {
    const world = validWorld();

    world.theme.regions = [{ name: 'Соляные пустоши', color: 'бежевый' }];

    expect(worldSchema.safeParse(world).success).toBe(false);
  });

  it('отвергает два края и шесть краёв', () => {
    const parseWithRegions = (count: number): boolean => {
      const world = validWorld();

      world.theme.regions = Array.from({ length: count }, () => ({ name: 'Край', color: '#c9b79c' }));

      return worldSchema.safeParse(world).success;
    };

    expect(parseWithRegions(2)).toBe(false);
    expect(parseWithRegions(6)).toBe(false);
  });

  it('отвергает слишком длинное название края', () => {
    const world = validWorld();

    world.theme.regions = [
      { name: 'Бесконечные соляные пустоши мёртвого моря', color: '#c9b79c' },
      { name: 'Машинный зал', color: '#415a77' },
      { name: 'Оранжерея', color: '#4f7942' },
    ];

    expect(worldSchema.safeParse(world).success).toBe(false);
  });
});

describe('eventBatchSchema', () => {
  it('принимает пачку событий', () => {
    expect(eventBatchSchema.safeParse({ events: [validEvent] }).success).toBe(true);
  });

  it('отклоняет пустую пачку', () => {
    expect(eventBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });
});
