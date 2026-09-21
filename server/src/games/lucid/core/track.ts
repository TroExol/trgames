import { LucidShared } from '@trgames/shared';

import { randomInt } from '@/games/lucid/core/random';

const MIN_FORKS = 3;
const MAX_FORKS = 5;
// Длина одной ветки развилки в клетках. Развилка стоит вдвое больше
const FORK_BRANCH_LENGTH = 2;

interface TBuildTrackParams {
  random: LucidShared.TRandomState;
  playerCount: number;
}

// Чем больше игроков, тем короче трек: иначе партия растягивается
export const cellCountForPlayers = (playerCount: number): number => {
  return 60 - Math.min(Math.max(playerCount, 2), 6) * 5;
};

export const eventCellIds = (track: LucidShared.TTrack): number[] => {
  return track.cells
    .filter(cell => cell.type === LucidShared.ECellType.EVENT)
    .map(cell => cell.id);
};

export const buildTrack = ({ random, playerCount }: TBuildTrackParams): LucidShared.TTrack => {
  const total = cellCountForPlayers(playerCount);
  const picked = randomInt(random, MIN_FORKS, MAX_FORKS);
  let current = picked.state;

  // Каждая развилка съедает FORK_BRANCH_LENGTH * 2 клеток, а между развилками
  // должен остаться хотя бы один прямой участок. Если бюджета не хватает,
  // развилок становится меньше — длина трека важнее их числа
  let forkCount = picked.value;
  const straightCount = (forks: number) => total - 2 - forks * FORK_BRANCH_LENGTH * 2;

  while (forkCount > MIN_FORKS && straightCount(forkCount) < forkCount + 1) {
    forkCount--;
  }

  // Прямые участки: по одной клетке в каждый промежуток, остаток раскидывается случайно
  const gaps = Array.from({ length: forkCount + 1 }, () => 1);

  for (let left = straightCount(forkCount) - gaps.length; left > 0; left--) {
    const gap = randomInt(current, 0, gaps.length - 1);
    current = gap.state;
    gaps[gap.value]++;
  }

  const cells: LucidShared.TCell[] = [
    { id: 0, type: LucidShared.ECellType.START, next: [] },
  ];
  // Клетки, из которых растёт следующий участок. Обычно одна, после развилки — две
  let tails = [0];
  let nextId = 1;

  // cells[id] совпадает с индексом: клетки добавляются подряд, начиная с нуля
  const addCell = (type: LucidShared.ECellType): number => {
    const id = nextId++;
    cells.push({ id, type, next: [] });

    return id;
  };

  const linkTo = (ids: number[], targetId: number): void => {
    ids.forEach(id => cells[id].next.push(targetId));
  };

  const addStraight = (length: number): void => {
    for (let i = 0; i < length; i++) {
      const id = addCell(LucidShared.ECellType.EVENT);
      linkTo(tails, id);
      tails = [id];
    }
  };

  const addFork = (): void => {
    const start = tails;

    tails = [0, 1].map(() => {
      let previous = start;
      let head = 0;

      for (let step = 0; step < FORK_BRANCH_LENGTH; step++) {
        const id = addCell(LucidShared.ECellType.EVENT);
        linkTo(previous, id);
        previous = [id];
        head = id;
      }

      return head;
    });
  };

  gaps.forEach((gap, index) => {
    addStraight(gap);

    if (index < forkCount) {
      addFork();
    }
  });

  const finishId = addCell(LucidShared.ECellType.FINISH);
  linkTo(tails, finishId);

  return { cells, startId: 0, finishId };
};
