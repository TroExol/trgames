import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { landOnCell } from '@/games/lucid/core/cells';

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
});

describe('landOnCell', () => {
  it('зелёная клетка даёт +3 Ресурса и строку в ленту', () => {
    const G = landOnCell(makeG(ECellType.GREEN), 'p1');

    expect(G.players.p1.resource).toBe(13);
    expect(G.log).toEqual(['Ваня: зелёная клетка, заряды +3']);
  });

  it('красная клетка отнимает 3 Ресурса', () => {
    const G = landOnCell(makeG(ECellType.RED), 'p1');

    expect(G.players.p1.resource).toBe(7);
    expect(G.log).toEqual(['Ваня: красная клетка, заряды −3']);
  });

  it('красная клетка не уводит Ресурс в минус и пишет фактическую потерю', () => {
    const G = landOnCell(makeG(ECellType.RED, 1), 'p1');

    expect(G.players.p1.resource).toBe(0);
    expect(G.log).toEqual(['Ваня: красная клетка, заряды −1']);
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
