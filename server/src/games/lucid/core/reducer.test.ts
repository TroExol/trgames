import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { forkTrack } from '@/games/lucid/vitest/factories';
import { setupParty } from '@/games/lucid/core/setup';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';
import { createRandom } from '@/games/lucid/core/random';

const makeParty = (seed = 'party-1') => setupParty({
  seed,
  players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
  content: {
    theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#001122', '#334455', '#667788'] },
    events: {},
  },
});

const roll = (state: LucidShared.TState) => applyMove(state, {
  type: EMoveType.ROLL,
  playerId: state.ctx.currentPlayer,
  stateId: state.stateId,
});

describe('setupParty', () => {
  it('все на старте, ход первого, фаза броска', () => {
    const state = makeParty();

    expect(state.G.players.a.position).toBe(0);
    expect(state.G.players.b.position).toBe(0);
    expect(state.ctx.currentPlayer).toBe('a');
    expect(state.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(state.stateId).toBe(0);
  });

  it('трек и кубики берут случайность из разных потоков', () => {
    // Иначе форма трека и первые броски оказались бы связаны
    const state = makeParty('seed-x');

    expect(state.G.random).toEqual(createRandom('seed-x:dice'));
    expect(state.G.random).not.toEqual(createRandom('seed-x'));
  });
});

describe('applyMove', () => {
  it('бросок двигает игрока и увеличивает версию состояния', () => {
    const next = roll(makeParty());

    expect(next.G.players.a.position).toBeGreaterThan(0);
    expect(next.stateId).toBe(1);
  });

  it('ход не своей очереди отклоняется', () => {
    const state = makeParty();
    const next = applyMove(state, { type: EMoveType.ROLL, playerId: 'b', stateId: 0 });

    expect(next).toBe(state);
  });

  it('ход с устаревшей версией состояния отклоняется', () => {
    const afterFirst = roll(makeParty());
    const stale = applyMove(afterFirst, {
      type: EMoveType.ROLL,
      playerId: afterFirst.ctx.currentPlayer,
      stateId: 0,
    });

    expect(stale).toBe(afterFirst);
  });

  it('ход, не совпадающий с фазой, отклоняется', () => {
    const state = makeParty();
    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: 0,
      optionIndex: 0,
    });

    expect(next).toBe(state);
  });

  it('пропуск хода тратится вместо броска', () => {
    const state = makeParty();
    state.G.players.a.skipTurns = 1;

    const next = roll(state);

    expect(next.G.players.a.position).toBe(0);
    expect(next.G.players.a.skipTurns).toBe(0);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('дойдя до финиша, игрок побеждает и партия заканчивается', () => {
    const state = makeParty();
    state.G.players.a.position = state.G.track.finishId - 1;

    const next = roll(state);

    expect(next.G.winner).toBe('a');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ENDED);
  });

  it('после конца партии ходы не принимаются', () => {
    const state = makeParty();
    state.G.players.a.position = state.G.track.finishId - 1;

    const ended = roll(state);

    expect(roll(ended)).toBe(ended);
  });
});

describe('развилки', () => {
  // Трек из фабрики вместо сгенерированного: развилка в известном месте,
  // и за ней нет второй, поэтому проверки не зависят от того, что выпало
  const partyOnFork = () => {
    const state = makeParty('fork-party');
    state.G.track = forkTrack();
    state.G.players.a.position = 1;

    return state;
  };

  it('дойдя до развилки, движение останавливается и спрашивает ветку', () => {
    const next = roll(partyOnFork());

    expect(next.ctx.phase).toBe(LucidShared.EPhase.BRANCH);
    expect(next.G.branchChoices).toEqual([2, 4]);
    expect(next.G.pendingSteps).toBeGreaterThan(0);
    expect(next.G.players.a.position).toBe(1);
  });

  it('после выбора ветки остаток шагов дохаживается', () => {
    const onFork = roll(partyOnFork());
    const chosen = applyMove(onFork, {
      type: EMoveType.CHOOSE_BRANCH,
      playerId: 'a',
      stateId: onFork.stateId,
      cellId: 4,
    });

    // Выбрана вторая ветка, значит игрок ушёл с развилки именно по ней
    expect(chosen.G.players.a.position).toBeGreaterThanOrEqual(4);
    expect(chosen.G.branchChoices).toEqual([]);
    expect(chosen.G.pendingSteps).toBe(0);
  });

  it('выбор ветки, которой нет в списке, отклоняется', () => {
    const onFork = roll(partyOnFork());
    const next = applyMove(onFork, {
      type: EMoveType.CHOOSE_BRANCH,
      playerId: 'a',
      stateId: onFork.stateId,
      cellId: 999,
    });

    expect(next).toBe(onFork);
  });
});
