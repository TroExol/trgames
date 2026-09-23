import type { LucidShared } from '@trgames/shared';

// Путь фишки по прямому участку трека, клетка за клеткой — для пошаговой
// анимации хода после ROLL (5.4, ADR — показ броска). Останавливается, как
// только текущая клетка не однозначна (развилка — next.length>1) или дальше
// пути нет (next.length===0): дальше сервер решал бы то же самое, спрашивая
// ветку или упираясь в конец. Итог короче фактического number шагов —
// вызывающий код сам решает, что делать с остатком (обычно просто применяет
// финальное состояние без дальнейшей анимации)
export const walkPath = (
  track: LucidShared.TTrack,
  from: number,
  steps: number,
): number[] => {
  const byId = new Map(track.cells.map(cell => [cell.id, cell]));
  const path: number[] = [];
  let position = from;

  for (let i = 0; i < steps; i++) {
    const cell = byId.get(position);

    if (!cell || cell.next.length !== 1) {
      break;
    }

    position = cell.next[0];
    path.push(position);
  }

  return path;
};
