import { LucidShared } from '@trgames/shared';

import { createRandom, shuffle } from '@/games/lucid/core/random';

// Раньше номера клеток куска уходили в промпт голым списком — параллельные
// куски видели один и тот же промпт и сходились на самой очевидной идее темы
// (в замере — «Соляной штиль» у половины событий партии). Завязка и край
// клетки теперь решает код, а не модель: механику и текст по-прежнему пишет
// модель, завязка лишь направление. Решение владельца 2026-09-23
// (docs/lucid/OPEN-QUESTIONS.md, «Завязки и края клеток — код»)
export const PREMISE_LEADER = 'удар по лидеру';
export const PREMISE_LAST = 'помощь отстающему';

const OTHER_PREMISES = [
  'находка',
  'ловушка',
  'встреча с незнакомцем',
  'торг или сделка',
  'стихия',
  'поломка или препятствие',
  'развилка или выбор пути',
  'тайна или загадка',
  'соблазн',
  'погоня',
  'отдых или передышка',
  'общее бедствие',
];

export interface TCellPremise {
  cellId: number;
  premise: string;
  // Клетки с «удар по лидеру» / «помощь отстающему» требуют от модели хотя бы
  // один вариант с атомом на этой цели — target подсказывает, какой
  target?: LucidShared.ETarget.FIRST | LucidShared.ETarget.LAST;
}

// Перестановка соседних одинаковых значений на уже перемешанном списке — без
// рандома, чисто механический проход, поэтому результат остаётся детерминирован
// тем же сидом, что и сам shuffle
const spreadAdjacent = (list: string[]): string[] => {
  const result = [...list];

  for (let i = 1; i < result.length; i++) {
    if (result[i] !== result[i - 1]) {
      continue;
    }

    const swapWith = result.findIndex((item, j) => j > i && item !== result[i] && item !== result[i - 1]);

    if (swapWith !== -1) {
      [result[i], result[swapWith]] = [result[swapWith], result[i]];
    }
  }

  return result;
};

// Раскладка завязок по всем клеткам партии разом, одним сидом: соседние куски
// (Promise.all в pipeline.ts) не видят раскладку друг друга, но получают её
// не пересекающейся, потому что она собрана заранее целиком
export const assignPremises = (cellIds: number[], seed: string): TCellPremise[] => {
  const total = cellIds.length;
  // По ~четверти клеток — обязательные завязки с требованием к механике,
  // остаток — из общего списка, циклом (пул короче клеток на длинном треке)
  const leaderCount = Math.min(Math.round(total / 4), total);
  const lastCount = Math.min(Math.round(total / 4), Math.max(total - leaderCount, 0));
  const otherCount = Math.max(total - leaderCount - lastCount, 0);

  const otherPool = Array.from({ length: otherCount }, (_unused, i) => OTHER_PREMISES[i % OTHER_PREMISES.length]);

  const pool = [
    ...Array.from({ length: leaderCount }, () => PREMISE_LEADER),
    ...Array.from({ length: lastCount }, () => PREMISE_LAST),
    ...otherPool,
  ];

  const shuffled = spreadAdjacent(shuffle(createRandom(`${seed}:premises`), pool).value);

  return cellIds.map((cellId, index) => {
    const premise = shuffled[index];

    return {
      cellId,
      premise,
      target: premise === PREMISE_LEADER
        ? LucidShared.ETarget.FIRST
        : premise === PREMISE_LAST
          ? LucidShared.ETarget.LAST
          : undefined,
    };
  });
};

// Край клетки — тот же расчёт по глубине пути, что у клиента на поле
// (regionForDepth, @trgames/shared), не отдельная логика. Глубина мира
// не зависит от завязок: считается по всему треку, не только по событиям
export const assignRegionNames = (
  cellIds: number[],
  track: LucidShared.TTrack,
  regions: LucidShared.TRegion[],
): Record<number, string> => {
  const depths = LucidShared.trackDepths(track);
  const maxDepth = Math.max(0, ...track.cells.map(cell => depths[cell.id] ?? 0));

  return Object.fromEntries(cellIds.map(cellId => [
    cellId,
    LucidShared.regionForDepth(regions, depths[cellId] ?? 0, maxDepth)?.name ?? '',
  ]));
};
