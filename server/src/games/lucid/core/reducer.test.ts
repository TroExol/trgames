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

  it('приход на финиш не победа: игрок стоит, ход переходит дальше', () => {
    const state = makeParty();
    state.G.players.a.position = state.G.track.finishId - 1;

    const rolled = roll(state);
    const next = rolled.ctx.phase === LucidShared.EPhase.DICE
      ? applyMove(rolled, { type: EMoveType.CHOOSE_DIE, playerId: 'a', stateId: rolled.stateId, dieIndex: 0 })
      : rolled;

    expect(next.G.players.a.position).toBe(state.G.track.finishId);
    expect(next.G.winner).toBeUndefined();
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(next.ctx.currentPlayer).toBe('b');
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

  it('CHOOSE_OPTION с нецелым номером варианта игнорируется', () => {
    const state = makeParty('bad-option');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Находка',
        text: 'Текст',
        options: [{ text: 'Подобрать', success: { atoms: [] } }],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 'length' as unknown as number,
    });

    expect(next).toBe(state);
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

  it('эффект варианта, доведший лидера до финиша, не объявляет победу', () => {
    const state = makeParty('effect-finish');
    state.G.track = lineTrack();
    state.G.players.a.position = 1;
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

    expect(next.G.players.b.position).toBe(4);
    expect(next.G.winner).toBeUndefined();
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
  });
});

describe('клетка после хода', () => {
  const longTrack = (type: LucidShared.ECellType): LucidShared.TTrack => ({
    startId: 0,
    finishId: 10,
    cells: Array.from({ length: 11 }, (_, id) => ({
      id,
      type: id === 0 ? LucidShared.ECellType.START : id === 10 ? LucidShared.ECellType.FINISH : type,
      next: id === 10 ? [] : [id + 1],
    })),
  });

  it('зелёная клетка даёт Ресурс, ход переходит дальше', () => {
    const state = makeParty('green');
    state.G.track = longTrack(LucidShared.ECellType.GREEN);
    const before = state.G.players.a.resource;

    const next = roll(state);

    expect(next.G.players.a.resource).toBe(before + 3);
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('клетка события даёт выбор и не трогает Ресурс', () => {
    const state = makeParty('event');
    state.G.track = longTrack(LucidShared.ECellType.EVENT);
    state.G.events = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [
      index + 1,
      {
        cellId: index + 1,
        title: 'Развилка судьбы',
        text: 'Что выберешь',
        options: [{ text: 'Взять', success: { atoms: [] } }],
      },
    ]));
    const before = state.G.players.a.resource;

    const next = roll(state);

    expect(next.ctx.phase).toBe(LucidShared.EPhase.CHOICE);
    expect(next.G.players.a.resource).toBe(before);
  });
});

describe('выбор кубика', () => {
  const straight = (length: number): LucidShared.TTrack => ({
    cells: Array.from({ length }, (_, id) => ({
      id,
      type: id === 0
        ? LucidShared.ECellType.START
        : id === length - 1 ? LucidShared.ECellType.FINISH : LucidShared.ECellType.EMPTY,
      next: id === length - 1 ? [] : [id + 1],
    })),
    startId: 0,
    finishId: length - 1,
  });

  const inPickZone = () => {
    const state = makeParty('dice-pick');
    state.G.track = straight(31);
    state.G.players.a.position = 15;

    return state;
  };

  const choose = (state: LucidShared.TState, dieIndex: number) => applyMove(state, {
    type: EMoveType.CHOOSE_DIE,
    playerId: state.ctx.currentPlayer,
    stateId: state.stateId,
    dieIndex,
  });

  it('ROLL в зоне выбора переводит в фазу DICE без движения', () => {
    const rolled = roll(inPickZone());

    expect(rolled.ctx.phase).toBe(LucidShared.EPhase.DICE);
    expect(rolled.ctx.currentPlayer).toBe('a');
    expect(rolled.G.players.a.position).toBe(15);
  });

  it('CHOOSE_DIE двигает фишку и передаёт ход', () => {
    const rolled = roll(inPickZone());
    const after = choose(rolled, 0);

    expect(after.G.players.a.position).toBe(15 + (rolled.G.lastRoll?.values?.[0] ?? 0));
    expect(after.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(after.ctx.currentPlayer).toBe('b');
  });

  it('CHOOSE_DIE с несуществующим кубиком игнорируется', () => {
    const rolled = roll(inPickZone());

    expect(choose(rolled, 2)).toBe(rolled);
  });

  it('CHOOSE_DIE с нецелым номером кубика игнорируется', () => {
    const rolled = roll(inPickZone());

    expect(choose(rolled, 'length' as unknown as number)).toBe(rolled);
    expect(choose(rolled, '1' as unknown as number)).toBe(rolled);
  });

  it('CHOOSE_DIE в фазе ROLL игнорируется', () => {
    const state = inPickZone();

    expect(choose(state, 0)).toBe(state);
  });
});

describe('сейф на финише', () => {
  const atSafe = (seed = 'safe', resource = 10) => {
    const state = makeParty(seed);
    state.G.track = lineTrack();
    state.G.players.a.position = state.G.track.finishId;
    state.G.players.a.resource = resource;

    return state;
  };

  const open = (state: LucidShared.TState, bonus: number, playerId = state.ctx.currentPlayer) => applyMove(state, {
    type: EMoveType.OPEN_SAFE,
    playerId,
    stateId: state.stateId,
    bonus,
  });

  const findSeed = (opened: boolean, bonus: number): LucidShared.TState => {
    for (let index = 0; index < 200; index++) {
      const state = atSafe(`safe-${index}`);
      const next = open(state, bonus);

      if (Boolean(next.G.winner) === opened) {
        return state;
      }
    }

    throw new Error('сид не найден');
  };

  it('удачная попытка — победа и конец партии', () => {
    const state = findSeed(true, 0);
    const next = open(state, 0);

    expect(next.G.winner).toBe('a');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ENDED);
    expect(next.G.lastRoll?.value).toBeGreaterThanOrEqual(LucidShared.SAFE_THRESHOLD);
    expect(next.G.lastRoll?.threshold).toBe(LucidShared.SAFE_THRESHOLD);
    expect(next.G.log.at(-1)).toMatch(/^Аня бросает за сейф: \d — сейф открыт$/);
  });

  it('провал — ход следующему, фишка на месте', () => {
    const state = findSeed(false, 0);
    const next = open(state, 0);

    expect(next.G.winner).toBeUndefined();
    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(next.G.players.a.position).toBe(state.G.track.finishId);
    expect(next.G.log.at(-1)).toMatch(/^Аня бросает за сейф: \d — не открыл$/);
  });

  it('доплата списывается до броска, сгорает при провале и сдвигает порог', () => {
    [1, 2].forEach(bonus => {
      const cost = LucidShared.SAFE_BONUS_COSTS[bonus];
      const lost = findSeed(false, bonus);
      const won = findSeed(true, bonus);
      const failed = open(lost, bonus);
      const opened = open(won, bonus);

      expect(failed.G.players.a.resource).toBe(10 - cost);
      expect(opened.G.players.a.resource).toBe(10 - cost);
      expect(failed.G.lastRoll?.threshold).toBe(LucidShared.SAFE_THRESHOLD - bonus);
      expect(opened.G.lastRoll!.value + bonus).toBeGreaterThanOrEqual(LucidShared.SAFE_THRESHOLD);
      expect(failed.G.lastRoll!.value + bonus).toBeLessThan(LucidShared.SAFE_THRESHOLD);
      expect(failed.G.log.at(-1)).toContain(`платит ${cost} и бросает за сейф`);
      expect(failed.G.log.at(-1)).toContain(`${failed.G.lastRoll!.value} + ${bonus} = ${failed.G.lastRoll!.value + bonus}`);
    });
  });

  it('доплата действует только на эту попытку', () => {
    const next = open(findSeed(false, 2), 2);

    expect(next.G.players.a.skipTurns).toBe(0);
    expect(next.G.players.b.resource).toBe(makeParty().G.players.b.resource);
  });

  it('неверный bonus отклоняется', () => {
    const state = atSafe();

    [-1, 3, 0.5, NaN, '1' as unknown as number, undefined as unknown as number].forEach(bonus => {
      expect(open(state, bonus)).toBe(state);
    });
  });

  it('не хватает Ресурса на доплату — отклоняется', () => {
    const state = atSafe('poor', 4);

    expect(open(state, 1)).toBe(state);
    expect(open(state, 2)).toBe(state);
    expect(open(atSafe('poor', 5), 1).stateId).toBe(1);
    expect(open(atSafe('poor', 10), 2).stateId).toBe(1);
  });

  it('не на финише — отклоняется', () => {
    const state = makeParty('away');

    expect(open(state, 0)).toBe(state);
  });

  it('не в свой ход и не в фазе ROLL — отклоняется', () => {
    const state = atSafe();
    state.G.players.b.position = state.G.track.finishId;

    expect(open(state, 0, 'b')).toBe(state);
    expect(open({ ...state, ctx: { ...state.ctx, phase: LucidShared.EPhase.CHOICE } }, 0).stateId).toBe(state.stateId);
  });

  it('обычный ROLL на финише отклоняется', () => {
    const state = atSafe();

    expect(roll(state)).toBe(state);
  });

  it('пропуск хода пропускает и попытку у сейфа', () => {
    const state = atSafe();
    state.G.players.a.skipTurns = 1;

    const next = open(state, 2);

    expect(next.G.players.a.skipTurns).toBe(0);
    expect(next.G.players.a.resource).toBe(10);
    expect(next.G.winner).toBeUndefined();
    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.G.log.at(-1)).toBe('Аня пропускает ход');
  });

  it('игрок на финише не двигается ничьими эффектами и не меняется местами', () => {
    const state = atSafe('immune');
    state.G.players.b.position = 1;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Шторм',
        text: 'Бушует',
        options: [{
          text: 'Переждать',
          success: {
            atoms: [
              { kind: LucidShared.EAtomKind.MOVE, target: LucidShared.ETarget.ALL, value: -2 },
              { kind: LucidShared.EAtomKind.MOVE, target: LucidShared.ETarget.FIRST, value: -2 },
              { kind: LucidShared.EAtomKind.SWAP_WITH_FIRST, target: LucidShared.ETarget.SELF, value: 0 },
              { kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.FIRST, value: -3 },
              { kind: LucidShared.EAtomKind.SKIP_TURN, target: LucidShared.ETarget.FIRST, value: 1 },
            ],
          },
        }],
      },
    };
    state.ctx = { ...state.ctx, currentPlayer: 'b', phase: LucidShared.EPhase.CHOICE };

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'b',
      stateId: state.stateId,
      optionIndex: 0,
    });

    expect(next.G.players.a.position).toBe(state.G.track.finishId);
    expect(next.G.players.b.position).toBe(0);
    expect(next.G.players.a.resource).toBe(7);
    expect(next.G.players.a.skipTurns).toBe(1);
  });

  it('обмен не происходит, если лидер на финише', () => {
    const state = atSafe('immune-first');
    state.G.players.a.position = 1;
    state.G.players.b.position = state.G.track.finishId;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Обмен',
        text: 'Меняемся',
        options: [{
          text: 'Поменяться',
          success: {
            atoms: [{ kind: LucidShared.EAtomKind.SWAP_WITH_FIRST, target: LucidShared.ETarget.SELF, value: 0 }],
          },
        }],
      },
    };
    state.ctx = { ...state.ctx, phase: LucidShared.EPhase.CHOICE };

    const next = applyMove(state, {
      type: EMoveType.CHOOSE_OPTION,
      playerId: 'a',
      stateId: state.stateId,
      optionIndex: 0,
    });

    expect(next.G.players.a.position).toBe(1);
    expect(next.G.players.b.position).toBe(state.G.track.finishId);
  });
});
