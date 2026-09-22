import { z } from 'zod';
import { LucidShared } from '@trgames/shared';

// Границы значений по видам атомов. Один источник правды: отсюда их берут
// и валидация, и описание словаря в промпте
export const ATOM_RANGES: Record<LucidShared.EAtomKind, { min: number; max: number }> = {
  [LucidShared.EAtomKind.MOVE]: { min: -4, max: 4 },
  [LucidShared.EAtomKind.RESOURCE]: { min: -3, max: 3 },
  [LucidShared.EAtomKind.SKIP_TURN]: { min: 1, max: 2 },
  // Значение не используется: обмен всегда идёт между ходящим и лидером
  [LucidShared.EAtomKind.SWAP_WITH_FIRST]: { min: 0, max: 0 },
};

export const THRESHOLD_RANGE = { min: 2, max: 6 };
export const COST_RANGE = { min: 1, max: 3 };

// Края мира: участки пути со своими названиями и цветами
export const REGION_RANGE = { min: 3, max: 5 } as const;
export const REGION_NAME_MAX = 24;
// Шесть шестнадцатеричных цифр: короткую запись не принимаем, чтобы на клиенте
// был ровно один формат
const HEX_COLOR = /^#[\da-f]{6}$/i;

const atomSchema = z
  .strictObject({
    kind: z.enum(LucidShared.EAtomKind),
    target: z.enum(LucidShared.ETarget),
    value: z.number().int(),
  })
  .refine(
    atom => atom.value >= ATOM_RANGES[atom.kind].min && atom.value <= ATOM_RANGES[atom.kind].max,
    'значение атома вне диапазона, допустимого для его вида',
  );

const conditionSchema = z.strictObject({
  field: z.enum(LucidShared.EConditionField),
  operator: z.enum(LucidShared.EConditionOperator),
  value: z.number().int().min(0).max(20),
});

const effectSchema = z.strictObject({
  atoms: z.array(atomSchema).min(1).max(3),
  condition: conditionSchema.optional(),
  otherwise: z.array(atomSchema).min(1).max(3).optional(),
});

const optionSchema = z.strictObject({
  text: z.string().min(1).max(160),
  threshold: z.number().int().min(THRESHOLD_RANGE.min).max(THRESHOLD_RANGE.max).optional(),
  cost: z.number().int().min(COST_RANGE.min).max(COST_RANGE.max).optional(),
  success: effectSchema,
  failure: effectSchema.optional(),
});

export const eventSchema = z.strictObject({
  cellId: z.number().int().min(0),
  title: z.string().min(1).max(80),
  text: z.string().min(1).max(400),
  options: z.array(optionSchema).max(3),
});

export const worldSchema = z.strictObject({
  theme: z.strictObject({
    name: z.string().min(1).max(80),
    resourceName: z.string().min(1).max(40),
    palette: z.array(z.string().regex(HEX_COLOR)).min(3).max(6),
    // Необязательное: модель может его не прислать, отсутствие обрабатывает клиент
    mood: z.enum(LucidShared.EThemeMood).optional(),
    // Обязательное в схеме, но необязательное в типе: без требования модель
    // края не вернёт, а партии, сгенерированные раньше, лежат в базе без них
    // и обязаны продолжать играться
    regions: z
      .array(z.strictObject({
        name: z.string().min(1).max(REGION_NAME_MAX),
        color: z.string().regex(HEX_COLOR),
      }))
      .min(REGION_RANGE.min)
      .max(REGION_RANGE.max),
  }),
  // Необязательное и не привязанное к списку игроков схемой: сверка ников
  // с реальными игроками и их нехватка — забота setupParty, а не валидации.
  // Так неполный или кривой ответ про роли не заставляет перегенерировать весь мир
  roles: z.array(z.strictObject({
    nickname: z.string().min(1).max(60),
    role: z.string().min(1).max(50),
  })).optional(),
});

export const eventBatchSchema = z.strictObject({
  events: z.array(eventSchema).min(1),
});
