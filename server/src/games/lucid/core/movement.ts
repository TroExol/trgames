import type { LucidShared } from '@trgames/shared';

export interface TWalkResult {
  position: number;
  // Сколько шагов осталось пройти после выбора ветки
  stepsLeft: number;
  // Куда можно шагнуть с развилки. Пусто, если выбора нет
  branchChoices: number[];
}

const indexCells = (track: LucidShared.TTrack): Map<number, LucidShared.TCell> => {
  return new Map(track.cells.map(cell => [cell.id, cell]));
};

const indexPredecessors = (track: LucidShared.TTrack): Map<number, number[]> => {
  const map = new Map<number, number[]>();

  track.cells.forEach(cell => {
    cell.next.forEach(nextId => map.set(nextId, [...(map.get(nextId) ?? []), cell.id]));
  });

  return map;
};

// Ход игрока: движение останавливается, как только упёрлось в развилку,
// чтобы игрок выбрал ветку сам. Остаток шагов возвращается в stepsLeft
export const walkForward = (
  track: LucidShared.TTrack,
  from: number,
  steps: number,
): TWalkResult => {
  const byId = indexCells(track);
  let position = from;
  let left = steps;

  while (left > 0) {
    const cell = byId.get(position);

    if (!cell || cell.next.length === 0) {
      break;
    }

    if (cell.next.length > 1) {
      return { position, stepsLeft: left, branchChoices: cell.next };
    }

    position = cell.next[0];
    left--;
  }

  return { position, stepsLeft: 0, branchChoices: [] };
};

// Принудительное перемещение эффектом. Выбор ветки не запрашивается: эффект может
// двигать игрока, чей ход сейчас не идёт, поэтому берётся первая ветка
export const moveBy = (track: LucidShared.TTrack, from: number, value: number): number => {
  // Обе карты строятся намеренно, а не по недосмотру: так обход остаётся одним циклом
  // без приведений типов. Трек — несколько десятков клеток, экономить тут нечего
  const forward = indexCells(track);
  const backward = indexPredecessors(track);
  const neighbors = (id: number): number[] => (value >= 0 ? forward.get(id)?.next : backward.get(id)) ?? [];

  let position = from;

  for (let step = 0; step < Math.abs(value); step++) {
    const [next] = neighbors(position);

    if (next === undefined) {
      break;
    }

    position = next;
  }

  return position;
};
