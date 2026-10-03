import type { TTrack } from './types/track';

// Расстояние каждой клетки от старта по связям (BFS). У обеих прядей развилки
// оно одинаковое — общая для сервера (завязки и края клеток, generation/premises)
// и клиента (раскладка на поле, trackLayout.ts) функция, единственный источник
export const trackDepths = (track: TTrack): Record<number, number> => {
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
