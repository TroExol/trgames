import type { LucidShared } from '@trgames/shared';

// Условные единицы: реальный размер задаётся масштабом SVG
export const CELL_STEP = 132;
export const ROW_STEP = 150;
// Насколько прядь развилки отходит от общей линии
export const STRAND_OFFSET = 40;
// Размах изгиба: заметно глазу и не съедает зазор между рядами
const MEANDER_AMPLITUDE = 26;

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
  // Наклон пути в этой точке, радианы: по нему поворачивается плитка
  angle: number;
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
  maxDepth: number;
}

// Перебор дешевле любой формулы: вариантов меньше десятка, а формула
// промахивается на округлении числа рядов
export const cellsPerRowFor = (width: number, height: number, depth: number): number => {
  const MIN = 4;
  const MAX = 14;
  const target = width / Math.max(height, 1);
  let best = MIN;
  let bestDistance = Infinity;

  for (let perRow = MIN; perRow <= MAX; perRow++) {
    const rows = Math.max(Math.ceil(depth / perRow), 1);
    const distance = Math.abs((perRow * CELL_STEP) / (rows * ROW_STEP) - target);

    if (distance < bestDistance) {
      best = perRow;
      bestDistance = distance;
    }
  }

  return best;
};

// Изгиб свой у каждой партии, но одинаковый у всех игроков: считается
// из названия мира, а не из случайного числа
const meander = (depth: number, seed: number): number => {
  const phase = (seed % 360) * (Math.PI / 180);
  const frequency = 0.55 + ((seed >> 8) % 5) / 10;

  return Math.sin(depth * frequency + phase) * MEANDER_AMPLITUDE;
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

// Сколько позиций по длине пути: клеток больше, потому что пряди развилки
// делят одну глубину. Нужно до укладки — по этому числу подбирается ряд
export const depthCount = (track: LucidShared.TTrack): number => {
  return Math.max(...Object.values(depthsFromStart(track))) + 1;
};

// Наклон пути в клетке: по соседям, а не по одной из связей. У развилки
// соседей двое, и середина между ними держит плитку симметрично
const angleAt = (cell: TLaidCell, previous: TLaidCell[], next: TLaidCell[]): number => {
  const middle = (group: TLaidCell[], fallback: TLaidCell): { x: number; y: number } =>
    (group.length === 0
      ? fallback
      : {
          x: group.reduce((sum, item) => sum + item.x, 0) / group.length,
          y: group.reduce((sum, item) => sum + item.y, 0) / group.length,
        });

  const from = middle(previous, cell);
  const to = middle(next, cell);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Старт без соседей или клетка, у которой соседи совпали: наклон не из чего
  // вывести, плитка остаётся прямой
  return dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx);
};

// Промежуток между рядами задаётся снаружи: число клеток в ряду целое, и
// раскладка в пропорцию экрана точно не попадает — остаток высоты раздаётся
// промежуткам. Поля сверху и снизу при этом не растут: доска заполняет рамку,
// а не висит в ней
export const layoutTrack = (
  track: LucidShared.TTrack,
  perRow: number,
  seed = 0,
  rowStep = ROW_STEP,
): TTrackLayout => {
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
        y: row * rowStep + ROW_STEP / 2 + meander(depth, seed) + strand * STRAND_OFFSET,
        angle: 0,
      });
    });
  });

  const byId = Object.fromEntries(cells.map(cell => [cell.id, cell]));
  const links = track.cells.flatMap(cell =>
    cell.next
      .filter(nextId => byId[nextId] !== undefined && byId[cell.id] !== undefined)
      .map(nextId => ({ from: cell.id, to: nextId })));
  const rows = Math.max(...cells.map(cell => cell.row)) + 1;

  cells.forEach(cell => {
    cell.angle = angleAt(
      cell,
      links.filter(link => link.to === cell.id).map(link => byId[link.from]),
      links.filter(link => link.from === cell.id).map(link => byId[link.to]),
    );
  });

  return {
    cells,
    byId,
    links,
    rows,
    perRow,
    width: perRow * CELL_STEP,
    height: (rows - 1) * rowStep + ROW_STEP,
    maxDepth: Math.max(...cells.map(cell => cell.depth)),
  };
};
