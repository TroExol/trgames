import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { freshTurn } from '@/games/lucid/core/turn';
import { landOnCell } from '@/games/lucid/core/cells';
import { emptyCards } from '@/games/lucid/core/cards';

const ECellType = LucidShared.ECellType;

const makeG = (type: LucidShared.ECellType, resource = 10): LucidShared.TG => ({
  players: { p1: { id: 'p1', nickname: 'Ваня', position: 1, resource, skipTurns: 0 } },
  order: ['p1'],
  track: {
    cells: [
      { id: 0, type: ECellType.START, next: [1] },
      {
        id: 1,
        type,
        next: [2],
        portal: type === ECellType.PORTAL ? { pair: 0, to: 3 } : undefined,
      },
      { id: 2, type: ECellType.EMPTY, next: [3] },
      { id: 3, type: ECellType.PORTAL, next: [4], portal: { pair: 0, to: 1 } },
      { id: 4, type: ECellType.FINISH, next: [] },
    ],
    startId: 0,
    finishId: 4,
  },
  events: {},
  theme: { name: 'Мир', resourceName: 'заряды', palette: [] },
  random: { seed: 1 },
  visited: [0, 1],
  log: [],
  branchChoices: [],
  pendingSteps: 0,
  cellHistory: {},
  cards: emptyCards(),
  turn: freshTurn(),
});

describe('landOnCell', () => {
  it('зелёная и красная клетки не меняют Ресурс и не пишут ленту', () => {
    [ECellType.GREEN, ECellType.RED].forEach(type => {
      const before = makeG(type);

      expect(landOnCell(before, 'p1')).toBe(before);
    });
  });

  it('портал переносит на парную клетку и отмечает её посещённой', () => {
    const G = landOnCell(makeG(ECellType.PORTAL), 'p1');

    expect(G.players.p1.position).toBe(3);
    expect(G.visited).toContain(3);
    expect(G.log).toEqual(['Ваня проходит портал']);
  });

  it('пустая клетка и клетка события ничего не меняют — старые партии из базы тоже', () => {
    [ECellType.EMPTY, ECellType.EVENT].forEach(type => {
      const before = makeG(type);

      expect(landOnCell(before, 'p1')).toBe(before);
    });
  });
});
