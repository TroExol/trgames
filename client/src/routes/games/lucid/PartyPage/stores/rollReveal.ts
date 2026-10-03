import type { LucidShared } from '@trgames/shared';

// Новый бросок отличается версией состояния, в которой он случился
// (TRoll.stateId, клеймит reducer — server/src/games/lucid/core/reducer.ts),
// а не значением: два броска подряд могут выпасть одинаковыми. Бросок без
// клейма сделан до появления поля (партия поднята из базы) — он заведомо
// старый. Сравнивать его по ссылке нельзя: каждое состояние с сервера — новый
// объект, и любое обновление (например, пропуск хода) заново проигрывало бы
// старый бросок с проходом фишки и возвратом на место
export const isNewRoll = (
  previous: LucidShared.TRoll | undefined,
  incoming: LucidShared.TRoll | undefined,
): boolean => incoming?.stateId !== undefined && incoming.stateId !== previous?.stateId;
