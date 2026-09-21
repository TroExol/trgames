import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  buildTrack,
  cellCountForPlayers,
  eventCellIds,
} from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

const reachable = (track: LucidShared.TTrack): Set<number> => {
  const byId = new Map(track.cells.map(cell => [cell.id, cell]));
  const seen = new Set<number>();
  const queue = [track.startId];

  while (queue.length) {
    const id = queue.shift()!;

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    queue.push(...(byId.get(id)?.next ?? []));
  }

  return seen;
};

const allPlayerCounts = [2, 3, 4, 5, 6];
const someSeeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

describe('buildTrack', () => {
  it('длина трека убывает с ростом числа игроков', () => {
    expect(cellCountForPlayers(2)).toBe(50);
    expect(cellCountForPlayers(6)).toBe(30);
  });

  it('трек имеет заданную длину', () => {
    allPlayerCounts.forEach(playerCount => {
      const track = buildTrack({ random: createRandom(`len-${playerCount}`), playerCount });

      expect(track.cells).toHaveLength(cellCountForPlayers(playerCount));
    });
  });

  it('все клетки достижимы из старта, финиш в том числе', () => {
    someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount: 4 });
      const seen = reachable(track);

      expect(seen.size).toBe(track.cells.length);
      expect(seen.has(track.finishId)).toBe(true);
    });
  });

  it('циклов нет: связи всегда ведут вперёд', () => {
    const track = buildTrack({ random: createRandom('cycles'), playerCount: 5 });

    track.cells.forEach(cell => {
      cell.next.forEach(nextId => expect(nextId).toBeGreaterThan(cell.id));
    });
  });

  it('у финиша нет исходящих связей, у старта есть', () => {
    const track = buildTrack({ random: createRandom('ends'), playerCount: 2 });
    const byId = new Map(track.cells.map(cell => [cell.id, cell]));

    expect(byId.get(track.finishId)!.next).toHaveLength(0);
    expect(byId.get(track.startId)!.next.length).toBeGreaterThan(0);
  });

  it('развилок всегда от 3 до 5 при любом сиде и числе игроков', () => {
    allPlayerCounts.forEach(playerCount => {
      someSeeds.forEach(seed => {
        const track = buildTrack({ random: createRandom(seed), playerCount });
        const forks = track.cells.filter(cell => cell.next.length > 1);

        expect(forks.length).toBeGreaterThanOrEqual(3);
        expect(forks.length).toBeLessThanOrEqual(5);
      });
    });
  });

  it('ветки развилки сходятся: у клетки схождения два предшественника', () => {
    const track = buildTrack({ random: createRandom('merge'), playerCount: 4 });
    const incoming = new Map<number, number>();

    track.cells.forEach(cell => {
      cell.next.forEach(nextId => incoming.set(nextId, (incoming.get(nextId) ?? 0) + 1));
    });

    const forks = track.cells.filter(cell => cell.next.length > 1);
    const merges = [...incoming.values()].filter(count => count > 1);

    expect(merges).toHaveLength(forks.length);
  });

  it('клетки событий — это все клетки, кроме старта и финиша', () => {
    const track = buildTrack({ random: createRandom('events'), playerCount: 3 });

    expect(eventCellIds(track)).toHaveLength(track.cells.length - 2);
    expect(eventCellIds(track)).not.toContain(track.startId);
    expect(eventCellIds(track)).not.toContain(track.finishId);
  });

  it('один сид даёт один и тот же трек', () => {
    const first = buildTrack({ random: createRandom('same'), playerCount: 4 });
    const second = buildTrack({ random: createRandom('same'), playerCount: 4 });

    expect(first).toEqual(second);
  });
});
