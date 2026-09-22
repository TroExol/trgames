import type { LucidShared } from '@trgames/shared';

// Условные единицы: реальный размер задаётся масштабом SVG
export const CELL_STEP = 100;
export const ROW_STEP = 120;
// Насколько прядь развилки отходит от общей линии
export const STRAND_OFFSET = 34;

export interface TLaidCell {
  id: number;
  type: LucidShared.ECellType;
  // Расстояние от старта по связям. У обеих прядей развилки оно одинаковое
  depth: number;
  // Прядь внутри своей глубины: 0 — общая линия, -1 и 1 — ветки развилки
  strand: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface TTrackLink {
  from: number;
  to: number;
}

export interface TTrackLayout {
  cells: TLaidCell[];
  byId: Record<number, TLaidCell>;
  links: TTrackLink[];
  rows: number;
  perRow: number;
  width: number;
  height: number;
}

// Сколько клеток помещается в ряд при данной ширине. На телефоне рядов много
// и они короткие, на десктопе наоборот — макет при этом один
export const cellsPerRow = (widthPx: number): number => {
  const MIN_CELL_PX = 56;

  return Math.min(Math.max(Math.floor(widthPx / MIN_CELL_PX), 4), 12);
};

const depthsFromStart = (track: LucidShared.TTrack): Record<number, number> => {
  const cellById = new Map(track.cells.map(cell => [cell.id, cell]));
  const depths: Record<number, number> = { [track.startId]: 0 };
  const queue = [track.startId];

  while (queue.length > 0) {
    const id = queue.shift()!;

    cellById.get(id)?.next.forEach(nextId => {
      if (depths[nextId] === undefined) {
        depths[nextId] = depths[id] + 1;
        queue.push(nextId);
      }
    });
  }

  return depths;
};

export const layoutTrack = (track: LucidShared.TTrack, perRow: number): TTrackLayout => {
  const depths = depthsFromStart(track);
  const byDepth = new Map<number, LucidShared.TCell[]>();

  track.cells.forEach(cell => {
    const depth = depths[cell.id];

    if (depth === undefined) {
      return;
    }

    byDepth.set(depth, [...(byDepth.get(depth) ?? []), cell]);
  });

  const cells: TLaidCell[] = [];

  byDepth.forEach((group, depth) => {
    const row = Math.floor(depth / perRow);
    const indexInRow = depth % perRow;
    // Нечётные ряды идут справа налево — это и есть змейка
    const col = row % 2 === 0 ? indexInRow : perRow - 1 - indexInRow;
    const sorted = [...group].sort((first, second) => first.id - second.id);

    sorted.forEach((cell, index) => {
      const strand = sorted.length === 1 ? 0 : index === 0 ? -1 : 1;

      cells.push({
        id: cell.id,
        type: cell.type,
        depth,
        strand,
        row,
        col,
        x: col * CELL_STEP + CELL_STEP / 2,
        y: row * ROW_STEP + ROW_STEP / 2 + strand * STRAND_OFFSET,
      });
    });
  });

  const byId = Object.fromEntries(cells.map(cell => [cell.id, cell]));
  const links = track.cells.flatMap(cell =>
    cell.next
      .filter(nextId => byId[nextId] !== undefined && byId[cell.id] !== undefined)
      .map(nextId => ({ from: cell.id, to: nextId })));
  const rows = Math.max(...cells.map(cell => cell.row)) + 1;

  return {
    cells,
    byId,
    links,
    rows,
    perRow,
    width: perRow * CELL_STEP,
    height: rows * ROW_STEP,
  };
};
