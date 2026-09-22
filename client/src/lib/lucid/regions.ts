import type { LucidShared } from '@trgames/shared';

import {
  blend,
  ensureContrast,
  parseHex,
  toHex,
} from '@/lib/lucid/colors';

// Насколько лента приглушена относительно цвета края
export const RIBBON_MIX = 0.55;
// Насколько основа перекрывает ленту в непройденной плитке
const HOLLOW_MIX = 0.55;

export interface TRegionColors {
  name: string;
  // Лента на отрезке края: контраст с основой не ниже 3:1
  ribbon: string;
  // Плитки, обводка и подпись края: контраст с основой не ниже 4.5:1
  ink: string;
  // Непройденная плитка: просвет основы в ленте. Цвет сплошной, а не
  // прозрачный, иначе сквозь плитку проступает круглый конец ленты
  hollow: string;
}

// Края раскладываются по длине пути, а не по содержимому клеток: содержимое
// секрет до посещения, и деление по нему слило бы карту
export const regionForDepth = <TItem>(
  items: TItem[],
  depth: number,
  maxDepth: number,
): TItem | undefined => {
  if (items.length === 0) {
    return undefined;
  }

  const index = Math.floor((depth / (maxDepth + 1)) * items.length);

  return items[Math.min(Math.max(index, 0), items.length - 1)];
};

// Цвета краёв приходят от модели и потому произвольны: бежевый край на бежевой
// основе стёр бы кусок пути. Приглушение ленты вмешано в цвет, а не сделано
// прозрачностью, иначе порог проверялся бы не на том, что видно
export const resolveRegions = (
  regions: LucidShared.TRegion[],
  base: string,
): TRegionColors[] => {
  const baseRgb = parseHex(base) ?? { r: 0, g: 0, b: 0 };

  return regions.map(region => {
    const rgb = parseHex(region.color) ?? baseRgb;

    const ribbon = ensureContrast(blend(rgb, baseRgb, RIBBON_MIX), baseRgb, 3);

    return {
      name: region.name,
      ribbon: toHex(ribbon),
      ink: toHex(ensureContrast(rgb, baseRgb, 4.5)),
      hollow: toHex(blend(baseRgb, ribbon, HOLLOW_MIX)),
    };
  });
};
