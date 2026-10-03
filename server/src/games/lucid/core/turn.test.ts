import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import {
  nextTurn,
  proceed,
  withTurn,
} from '@/games/lucid/core/turn';

const makeState = (G = makeG()): LucidShared.TState => ({
  G,
  ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
  stateId: 0,
});

describe('машина хода', () => {
  it('после клетки ход доходит до конца и переходит к следующему', () => {
    const state = makeState(withTurn(makeG(), { step: LucidShared.ETurnStep.LANDED }));
    const next = proceed(state);

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(next.G.turn).toEqual({ step: LucidShared.ETurnStep.START, fired: [], extraTurn: false });
  });

  it('ход ещё раз оставляет того же игрока', () => {
    const state = makeState(withTurn(makeG(), { extraTurn: true }));
    const next = nextTurn(state);

    expect(next.ctx.currentPlayer).toBe('a');
    expect(next.ctx.turn).toBe(2);
    expect(next.G.turn.extraTurn).toBe(false);
  });
});
