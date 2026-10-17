import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { forkTrack, makeG } from '@/games/lucid/vitest/factories';
import { applyAtom } from '@/games/lucid/core/atoms';

const threePlayers = () => makeG({
  track: forkTrack(),
  players: [
    { id: 'a', nickname: 'Аня', position: 6, resource: 3 },
    { id: 'b', nickname: 'Боря', position: 1, resource: 1 },
    { id: 'c', nickname: 'Вася', position: 3, resource: 0 },
  ],
});

const atom = (
  kind: LucidShared.EAtomKind,
  target: LucidShared.ETarget,
  value: number,
): LucidShared.TAtom => ({ kind, target, value });

describe('applyAtom: портал', () => {
  it('сдвиг на число клеток на портал переносит на парную клетку', () => {
    const base = makeG({
      track: {
        startId: 0,
        finishId: 5,
        cells: [
          { id: 0, type: LucidShared.ECellType.START, next: [1] },
          { id: 1, type: LucidShared.ECellType.EMPTY, next: [2] },
          { id: 2, type: LucidShared.ECellType.PORTAL, next: [3], portal: { pair: 0, to: 4 } },
          { id: 3, type: LucidShared.ECellType.EMPTY, next: [4] },
          { id: 4, type: LucidShared.ECellType.PORTAL, next: [5], portal: { pair: 0, to: 2 } },
          { id: 5, type: LucidShared.ECellType.FINISH, next: [] },
        ],
      },
      players: [{ id: 'a', nickname: 'Аня', position: 0, resource: 3 }],
    });
    const G = applyAtom(base, 'a', atom(LucidShared.EAtomKind.MOVE, LucidShared.ETarget.SELF, 2));

    expect(G.players.a.position).toBe(4);
    expect(G.visited).toContain(4);
    expect(G.log).toContain('Аня проходит портал');
  });
});

describe('applyAtom', () => {
  it('движение идёт по связям трека', () => {
    const G = applyAtom(threePlayers(), 'c', atom(
      LucidShared.EAtomKind.MOVE,
      LucidShared.ETarget.SELF,
      1,
    ));

    // Из клетки 3 по связям путь ведёт в клетку схождения 6, а не в клетку 4
    expect(G.players.c.position).toBe(6);
  });

  it('ресурс не уходит в минус: отдаёшь сколько есть', () => {
    const G = applyAtom(threePlayers(), 'c', atom(
      LucidShared.EAtomKind.RESOURCE,
      LucidShared.ETarget.SELF,
      -5,
    ));

    expect(G.players.c.resource).toBe(0);
  });

  it('цель «все» затрагивает каждого', () => {
    const G = applyAtom(threePlayers(), 'a', atom(
      LucidShared.EAtomKind.RESOURCE,
      LucidShared.ETarget.ALL,
      2,
    ));

    expect([G.players.a.resource, G.players.b.resource, G.players.c.resource]).toEqual([5, 3, 2]);
  });

  it('пропуск хода накапливается', () => {
    const G = applyAtom(threePlayers(), 'b', atom(
      LucidShared.EAtomKind.SKIP_TURN,
      LucidShared.ETarget.SELF,
      1,
    ));

    expect(G.players.b.skipTurns).toBe(1);
  });

  it('обмен местами меняет позиции ходящего и лидера', () => {
    const G = applyAtom(threePlayers(), 'b', atom(
      LucidShared.EAtomKind.SWAP_WITH_FIRST,
      LucidShared.ETarget.SELF,
      0,
    ));

    expect(G.players.b.position).toBe(6);
    expect(G.players.a.position).toBe(1);
  });

  it('обмен местами ничего не делает, если ходящий сам лидер', () => {
    const before = threePlayers();
    const G = applyAtom(before, 'a', atom(
      LucidShared.EAtomKind.SWAP_WITH_FIRST,
      LucidShared.ETarget.SELF,
      0,
    ));

    expect(G).toBe(before);
  });

  it('не меняет исходное состояние', () => {
    const G = threePlayers();
    const before = JSON.stringify(G);

    applyAtom(G, 'a', atom(LucidShared.EAtomKind.RESOURCE, LucidShared.ETarget.ALL, 5));

    expect(JSON.stringify(G)).toBe(before);
  });

  it('пустая цель никого не меняет', () => {
    const before = threePlayers();
    // Ничья за первое место: крайним не считается никто, цель разрешится в пустой список
    before.players.b.position = 6;
    const snapshot = JSON.stringify(before.players);

    const G = applyAtom(before, 'c', atom(
      LucidShared.EAtomKind.MOVE,
      LucidShared.ETarget.FIRST,
      -2,
    ));

    expect(JSON.stringify(G.players)).toBe(snapshot);
  });

  it('обмен местами не зависит от указанной цели', () => {
    const G = applyAtom(threePlayers(), 'b', atom(
      LucidShared.EAtomKind.SWAP_WITH_FIRST,
      LucidShared.ETarget.ALL,
      0,
    ));

    expect(G.players.b.position).toBe(6);
    expect(G.players.a.position).toBe(1);
  });
});
