import type { LucidShared } from '@trgames/shared';

import { createRandom, shuffle } from '@/games/lucid/core/random';

// Имя файла не повторяет имя модуля намеренно: ts-node разрешает
// расширения в порядке .js, .json, .node и только потом .ts, и импорт
// './fallback' из соседних модулей приводил бы к JSON вместо этого кода
import fallback from './fallbackContent.json';

const POOL = fallback.events as LucidShared.TEvent[];

// События раскладываются по клеткам перемешанными от сида, а не сидят на своих
// номерах: иначе на коротком треке хвост пула не увидел бы никто, а при повторном
// сбое генерации партия вышла бы той же самой
export const loadFallbackContent = (
  eventCellIds: number[],
  seed: string,
): LucidShared.TPartyContent => {
  const picked = shuffle(createRandom(`${seed}:fallback`), POOL).value;

  return {
    theme: fallback.theme as LucidShared.TTheme,
    events: eventCellIds.reduce<Record<number, LucidShared.TEvent>>(
      (acc, cellId, index) => ({
        ...acc,
        [cellId]: { ...picked[index % picked.length], cellId },
      }),
      {},
    ),
  };
};
