import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  doubleForkTrack,
  forkTrack,
  lineTrack,
} from '@/games/lucid/vitest/factories';
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

  it('свежий бросок клеймится версией состояния, в которой случился', () => {
    const next = roll(makeParty());

    expect(next.G.lastRoll?.stateId).toBe(next.stateId);
  });

  it('ход без нового броска не переклеймляет старый lastRoll', () => {
    const state = makeParty('fork-restamp');
    state.G.track = forkTrack();
    state.G.players.a.position = 1;

    const onFork = roll(state);
    const stampBeforeBranch = onFork.G.lastRoll?.stateId;
    const chosen = applyMove(onFork, {
      type: EMoveType.CHOOSE_BRANCH,
      playerId: 'a',
      stateId: onFork.stateId,
      cellId: onFork.G.branchChoices[0],
    });

    // Выбор ветки не бросает кубик — клеймо броска остаётся от ROLL,
    // а не от свежей версии состояния после CHOOSE_BRANCH
    expect(chosen.G.lastRoll?.stateId).toBe(stampBeforeBranch);
    expect(chosen.stateId).not.toBe(stampBeforeBranch);
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

  it('вторая развилка подряд снова спрашивает ветку', () => {
    const state = makeParty('double-fork');
    state.G.track = doubleForkTrack();
    state.G.players.a.position = 1;
    state.G.branchChoices = [2, 4];
    state.G.pendingSteps = 5;
    state.ctx.phase = LucidShared.EPhase.BRANCH;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_BRANCH,
      playerId: 'a',
      stateId: state.stateId,
      cellId: 2,
    });

    // Шаг на клетку 2 тратит один шаг из пяти, дальше 2→3→6 съедают ещё два.
    // На клетке 6 снова развилка, значит спрашиваем ветку с остатком в два шага
    expect(next.ctx.phase).toBe(LucidShared.EPhase.BRANCH);
    expect(next.G.players.a.position).toBe(6);
    expect(next.G.branchChoices).toEqual([7, 9]);
    expect(next.G.pendingSteps).toBe(2);
  });
});

describe('события', () => {
  it('событие без вариантов не останавливает ход', () => {
    const state = makeParty('empty-event');
    state.G.track = lineTrack();
    state.G.events = Object.fromEntries([1, 2, 3].map(cellId => [
      cellId,
      {
        cellId,
        title: 'Пусто',
        text: 'Ничего не происходит',
        options: [],
      },
    ]));

    const next = roll(state);

    // Куда бы ни привёл бросок, фаза выбора не наступает: выбирать не из чего
    expect(next.ctx.phase).not.toBe(LucidShared.EPhase.CHOICE);
  });

  it('событие, которое игроку не по карману целиком, проходит мимо', () => {
    const state = makeParty('too-poor');
    state.G.track = lineTrack();
    state.G.players.a.resource = 0;
    state.G.events = Object.fromEntries([1, 2, 3].map(cellId => [
      cellId,
      {
        cellId,
        title: 'Лавка',
        text: 'Всё стоит денег, а их нет',
        options: [{
          text: 'Купить',
          cost: 3,
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.RESOURCE,
              target: LucidShared.ETarget.SELF,
              value: 1,
            }],
          },
        }],
      },
    ]));

    const next = roll(state);

    // Ни одного доступного варианта: выбирать не из чего, иначе у игрока
    // не осталось бы ни одного допустимого хода и партия встала бы
    expect(next.ctx.phase).not.toBe(LucidShared.EPhase.CHOICE);
  });

  it('разыгранный вариант завершает ход, даже если игрок не сдвинулся', () => {
    const state = makeParty('stay-put');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Находка',
        text: 'Ты подбираешь монету и остаёшься где стоял',
        options: [{
          text: 'Подобрать',
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.RESOURCE,
              target: LucidShared.ETarget.SELF,
              value: 1,
            }],
          },
        }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    // Клетку заново не проверяем: иначе то же событие предлагалось бы бесконечно
    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
  });

  it('выбор варианта пишет в ленту, что выбрано, и что применилось', () => {
    const state = makeParty('log-choice');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Находка',
        text: 'Ты подбираешь монету',
        options: [{
          text: 'Подобрать',
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.RESOURCE,
              target: LucidShared.ETarget.SELF,
              value: 1,
            }],
          },
        }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    expect(next.G.log).toEqual(['Аня выбирает «Подобрать»', 'Аня: дублоны +1']);
  });

  it('выбор варианта пишет запись в историю клетки: ветка success, без броска', () => {
    const state = makeParty('history-success');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Находка',
        text: 'Ты подбираешь монету',
        options: [{
          text: 'Подобрать',
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.RESOURCE,
              target: LucidShared.ETarget.SELF,
              value: 1,
            }],
          },
        }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    expect(next.G.cellHistory[1]).toEqual([{
      playerId: 'a',
      nickname: 'Аня',
      optionIndex: 0,
      branch: 'success',
      roll: undefined,
      lines: ['Аня выбирает «Подобрать»', 'Аня: дублоны +1'],
    }]);
  });

  it('выбор варианта с недостижимым порогом пишет ветку failure с броском', () => {
    const state = makeParty('history-failure');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Риск',
        text: 'Попробовать удачу',
        options: [{
          text: 'Рискнуть',
          threshold: 7,
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.RESOURCE,
              target: LucidShared.ETarget.SELF,
              value: 5,
            }],
          },
        }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    // Порог 7 недостижим кубиком 1..6 — ветка неминуемо failure
    expect(next.G.cellHistory[1]).toHaveLength(1);
    expect(next.G.cellHistory[1][0].branch).toBe('failure');
    expect(next.G.cellHistory[1][0].roll).toBeLessThan(7);
  });

  it('победить можно эффектом варианта, а не только броском', () => {
    const state = makeParty('effect-win');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    // Лидер в шаге от финиша, и эффект варианта дотолкнёт именно его
    state.G.players.b.position = 3;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Попутный ветер',
        text: 'Кому-то он на руку больше, чем тебе',
        options: [{
          text: 'Поднять паруса',
          success: {
            atoms: [{
              kind: LucidShared.EAtomKind.MOVE,
              target: LucidShared.ETarget.FIRST,
              value: 1,
            }],
          },
        }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    // Победитель ищется среди всех игроков, а не только среди ходящего
    expect(next.G.winner).toBe('b');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ENDED);
  });
});
