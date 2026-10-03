import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { buildTrack } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

const ECellType = LucidShared.ECellType;
const allPlayerCounts = [2, 3, 4, 5, 6];
const someSeeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const countOf = (track: LucidShared.TTrack, type: LucidShared.ECellType): number =>
  track.cells.filter(cell => cell.type === type).length;

describe('assignCellTypes через buildTrack', () => {
  it('старт и финиш сохраняют свои типы', () => {
    const track = buildTrack({ random: createRandom('edges'), playerCount: 3 });

    expect(track.cells[track.startId].type).toBe(ECellType.START);
    expect(track.cells[track.finishId].type).toBe(ECellType.FINISH);
  });

  it('ровно две пары порталов, каждый ведёт на свою пару', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const portals = track.cells.filter(cell => cell.type === ECellType.PORTAL);

      expect(portals).toHaveLength(4);
      portals.forEach(cell => {
        const target = track.cells[cell.portal!.to];

        expect(target.type).toBe(ECellType.PORTAL);
        expect(target.portal).toEqual({ pair: cell.portal!.pair, to: cell.id });
      });
    }));
  });

  it('портал стоит только на прямой клетке: один выход и единственная на своей глубине', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const depths = LucidShared.trackDepths(track);

      track.cells.filter(cell => cell.type === ECellType.PORTAL).forEach(cell => {
        const sameDepth = track.cells.filter(other => depths[other.id] === depths[cell.id]);

        expect(cell.next).toHaveLength(1);
        expect(sameDepth).toHaveLength(1);
      });
    }));
  });

  it('портал переносит на 4–9 уровней глубины', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const depths = LucidShared.trackDepths(track);

      track.cells.filter(cell => cell.type === ECellType.PORTAL).forEach(cell => {
        const distance = Math.abs(depths[cell.id] - depths[cell.portal!.to]);

        expect(distance).toBeGreaterThanOrEqual(4);
        expect(distance).toBeLessThanOrEqual(9);
      });
    }));
  });

  it('обе клетки первой пары раньше обеих клеток второй пары', () => {
    allPlayerCounts.forEach(playerCount => someSeeds.forEach(seed => {
      const track = buildTrack({ random: createRandom(seed), playerCount });
      const depths = LucidShared.trackDepths(track);
      const portals = track.cells.filter(cell => cell.type === ECellType.PORTAL);
      const depthsOf = (pair: number): number[] =>
        portals.filter(cell => cell.portal!.pair === pair).map(cell => depths[cell.id]);

      expect(Math.max(...depthsOf(0))).toBeLessThan(Math.min(...depthsOf(1)));
    }));
  });

  it('доли: событий 40%, зелёных и красных по 15% от внутренних клеток без порталов', () => {
    allPlayerCounts.forEach(playerCount => {
      const track = buildTrack({ random: createRandom('shares'), playerCount });
      const rest = track.cells.length - 2 - 4;

      expect(countOf(track, ECellType.EVENT)).toBe(Math.round(rest * 0.4));
      expect(countOf(track, ECellType.GREEN)).toBe(Math.round(rest * 0.15));
      expect(countOf(track, ECellType.RED)).toBe(Math.round(rest * 0.15));
      expect(countOf(track, ECellType.EMPTY)).toBe(
        rest - Math.round(rest * 0.4) - 2 * Math.round(rest * 0.15),
      );
    });
  });

  it('раскладка воспроизводима от сида', () => {
    const first = buildTrack({ random: createRandom('same'), playerCount: 4 });
    const second = buildTrack({ random: createRandom('same'), playerCount: 4 });

    expect(first).toEqual(second);
  });
});
