import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { forkTrack, makeG } from '@/games/lucid/vitest/factories';
import { describeAtomLog } from '@/games/lucid/core/atomLog';

const G = makeG({
  track: forkTrack(),
  players: [
    { id: 'a', nickname: 'Аня', position: 7, resource: 3 },
    { id: 'b', nickname: 'Боря', position: 1, resource: 1 },
  ],
});

const move = (target: LucidShared.ETarget): LucidShared.TAtom => ({
  kind: LucidShared.EAtomKind.MOVE,
  target,
  value: -2,
});

describe('describeAtomLog у сейфа', () => {
  it('движение лидера у сейфа никого не сдвигает', () => {
    expect(describeAtomLog(G, 'b', move(LucidShared.ETarget.FIRST))).toBe('у сейфа никого не сдвинуть');
  });

  it('движение всех называет только тех, кого сдвинуло', () => {
    expect(describeAtomLog(G, 'b', move(LucidShared.ETarget.ALL))).toBe(
      `Боря: ${LucidShared.describeAtomAction(move(LucidShared.ETarget.ALL), G.theme.resourceName)}`,
    );
  });
});
