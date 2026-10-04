import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { forkTrack, makeG } from '@/games/lucid/vitest/factories';
import { resolveTarget } from '@/games/lucid/core/targets';

const threePlayers = () => makeG({
  track: forkTrack(),
  players: [
    { id: 'a', nickname: 'Аня', position: 6, resource: 3 },
    { id: 'b', nickname: 'Боря', position: 1, resource: 1 },
    { id: 'c', nickname: 'Вася', position: 3, resource: 0 },
  ],
});

describe('resolveTarget', () => {
  it('первый — ближайший к финишу, последний — самый дальний', () => {
    const G = threePlayers();

    expect(resolveTarget(G, 'b', LucidShared.ETarget.FIRST)).toEqual(['a']);
    expect(resolveTarget(G, 'a', LucidShared.ETarget.LAST)).toEqual(['b']);
  });

  it('при равном положении никто не первый и не последний', () => {
    const G = threePlayers();
    G.players.b.position = 6;

    expect(resolveTarget(G, 'c', LucidShared.ETarget.FIRST)).toEqual([]);
  });

  it('игроки на разных ветках одной глубины — ничья, номер клетки не важен', () => {
    const G = threePlayers();
    G.players.a.position = 3;
    G.players.c.position = 5;
    G.players.b.position = 1;

    expect(resolveTarget(G, 'b', LucidShared.ETarget.FIRST)).toEqual([]);
    expect(resolveTarget(G, 'b', LucidShared.ETarget.LAST)).toEqual(['b']);
  });

  it('себя и всех разрешает верно', () => {
    const G = threePlayers();

    expect(resolveTarget(G, 'b', LucidShared.ETarget.SELF)).toEqual(['b']);
    expect(resolveTarget(G, 'b', LucidShared.ETarget.ALL)).toEqual(['a', 'b', 'c']);
  });
});
