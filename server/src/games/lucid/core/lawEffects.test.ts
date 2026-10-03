import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import {
  land,
  proceed,
  startTurn,
  withTurn,
} from '@/games/lucid/core/turn';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';

const {
  ECellType,
  ELaw,
  EPhase,
  ETurnStep,
} = LucidShared;

const colorTrack = (types: LucidShared.ECellType[]): LucidShared.TTrack => ({
  startId: 0,
  finishId: types.length + 1,
  cells: [
    { id: 0, type: ECellType.START, next: [1] },
    ...types.map((type, index) => ({ id: index + 1, type, next: [index + 2] })),
    { id: types.length + 1, type: ECellType.FINISH, next: [] },
  ],
});

const goodEvent = (cellId: number, cost?: number): LucidShared.TEvent => ({
  cellId,
  title: 'Находка',
  text: 'Нашёл',
  options: [{
    text: 'Взять',
    cost,
    success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: 2 }] },
  }],
});

const badEvent = (cellId: number): LucidShared.TEvent => ({
  cellId,
  title: 'Напасть',
  text: 'Беда',
  options: [{
    text: 'Терпеть',
    success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: -2 }] },
  }],
});

const stateWith = (
  laws: LucidShared.ELaw[],
  types: LucidShared.ECellType[],
  positions: Record<string, number>,
  resource = 10,
  events: Record<number, LucidShared.TEvent> = {},
): LucidShared.TState => {
  const G = makeG({
    track: colorTrack(types),
    events,
    players: Object.entries(positions).map(([id, position]) => ({
      id,
      nickname: id === 'a' ? 'Аня' : 'Боря',
      position,
      resource,
    })),
  });

  return {
    G: { ...G, cards: { ...G.cards, laws: [...laws, null, null, null].slice(0, 3) } },
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: EPhase.ROLL },
    stateId: 0,
  };
};

const empties = (count: number): LucidShared.ECellType[] => Array.from({ length: count }, () => ECellType.EMPTY);

const afterRoll = (
  state: LucidShared.TState,
  from: number,
  roll: Partial<LucidShared.TRoll>,
): LucidShared.TState => ({
  ...state,
  G: withTurn({ ...state.G, lastRoll: { playerId: 'a', value: 1, ...roll } }, { from }),
});

const choose = (state: LucidShared.TState): LucidShared.TState =>
  applyMove(state, { type: EMoveType.CHOOSE_OPTION, playerId: 'a', stateId: state.stateId, optionIndex: 0 });

const atEnd = (state: LucidShared.TState): LucidShared.TState => ({
  ...state,
  G: withTurn(state.G, { step: ETurnStep.END }),
});

describe('законы цвета', () => {
  it('без законов зелёная ничего не даёт', () => {
    const next = land(stateWith([], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(10);
  });

  it('«Урожай»: зелёная +5', () => {
    const next = land(stateWith([ELaw.GREEN_RESOURCE], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(15);
    expect(next.G.log).toEqual(['закон «Урожай»: Аня — монеты +5']);
  });

  it('«Тропа» срабатывает один раз, даже если привела на зелёную', () => {
    const types = [ECellType.GREEN, ...empties(6), ECellType.GREEN, ECellType.EMPTY];
    const next = land(stateWith([ELaw.GREEN_ADVANCE], types, { a: 1, b: 0 }));

    expect(next.G.players.a.position).toBe(8);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Второе дыхание»: снова ходит тот же игрок', () => {
    const next = land(stateWith([ELaw.GREEN_AGAIN], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.ctx.currentPlayer).toBe('a');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
  });

  it('«Налог» вдвоём: отдаёшь 4, не больше, чем есть', () => {
    const next = land(stateWith([ELaw.RED_PAY_ALL], [ECellType.RED], { a: 1, b: 0 }, 3));

    expect(next.G.players.a.resource).toBe(0);
    expect(next.G.players.b.resource).toBe(6);
  });

  it('«Пошлина» предлагает выбор из двух вариантов', () => {
    const next = land(stateWith([ELaw.RED_CHOICE], [ECellType.RED], { a: 1, b: 0 }));

    expect(next.ctx.phase).toBe(EPhase.CHOICE);
    expect(next.G.turn.lawEvent?.options).toHaveLength(2);
  });

  it('«Пошлина»: после выбора ход переходит дальше', () => {
    const next = choose(land(stateWith([ELaw.RED_CHOICE], [ECellType.RED], { a: 1, b: 0 })));

    expect(next.G.players.a.resource).toBe(7);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Дурная примета» без бед в партии — ход идёт дальше', () => {
    const next = land(stateWith([ELaw.RED_BAD], [ECellType.RED], { a: 1, b: 0 }));

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
  });

  it('«Дурная примета» с бедой в партии разыгрывает её', () => {
    const state = stateWith([ELaw.RED_BAD], [ECellType.RED, ...empties(4)], { a: 1, b: 0 }, 10, { 5: badEvent(5) });
    const next = land(state);

    expect(next.ctx.phase).toBe(EPhase.CHOICE);
    expect(next.G.turn.eventCellId).toBe(5);
  });

  it('«Добрый знак»: событие без беды, после выбора ход у второго игрока', () => {
    const types = [ECellType.GREEN, ...empties(5)];
    const paused = land(stateWith([ELaw.GREEN_GOOD], types, { a: 1, b: 0 }, 10, { 5: goodEvent(5) }));

    expect(paused.ctx.phase).toBe(EPhase.CHOICE);
    expect(paused.G.turn.eventCellId).toBe(5);

    const next = choose(paused);

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.G.players.a.resource).toBe(12);
  });

  it('событие, которое игрок не может оплатить, не повисает: ход идёт дальше', () => {
    const types = [ECellType.GREEN, ...empties(5)];
    const next = land(stateWith([ELaw.GREEN_GOOD], types, { a: 1, b: 0 }, 10, { 5: goodEvent(5, 99) }));

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
    expect(next.G.log).toContain('Аня: событие «Находка» не по карману');
  });

  it('два закона цвета одной клетки срабатывают слева направо', () => {
    const next = land(stateWith([ELaw.GREEN_RESOURCE, ELaw.GREEN_AGAIN], [ECellType.GREEN], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(15);
    expect(next.ctx.currentPlayer).toBe('a');
  });

  it('законы чужого цвета не пересекаются', () => {
    const next = land(stateWith([ELaw.GREEN_RESOURCE, ELaw.RED_PAY_ALL], [ECellType.RED], { a: 1, b: 0 }));

    expect(next.G.players.a.resource).toBe(6);
    expect(next.G.players.b.resource).toBe(14);
  });
});

describe('законы броска', () => {
  const track = empties(10);

  it('«Подножка»: обогнанный отдаёт 3', () => {
    const state = afterRoll(stateWith([ELaw.OVERTAKE_STEAL], track, { a: 4, b: 3 }), 1, {});
    const next = land(state);

    expect(next.G.players.a.resource).toBe(13);
    expect(next.G.players.b.resource).toBe(7);
  });

  it('«Подножка»: стоявший на клетке старта хода тоже обогнан', () => {
    const next = land(afterRoll(stateWith([ELaw.OVERTAKE_STEAL], track, { a: 4, b: 1 }), 1, {}));

    expect(next.G.players.a.resource).toBe(13);
    expect(next.G.players.b.resource).toBe(7);
  });

  it('«Подножка»: впереди стоящий не обогнан', () => {
    const next = land(afterRoll(stateWith([ELaw.OVERTAKE_STEAL], track, { a: 4, b: 5 }), 1, {}));

    expect(next.G.players.a.resource).toBe(10);
    expect(next.G.players.b.resource).toBe(10);
  });

  it('«Шестёрка»: пропуск следующего хода', () => {
    const next = land(afterRoll(stateWith([ELaw.SIX_SKIP], track, { a: 4, b: 0 }), 1, { value: 6 }));

    expect(next.G.players.a.skipTurns).toBe(1);
  });

  it('«Шестёрка»: шесть на одном из двух кубиков тоже считается', () => {
    const next = land(afterRoll(stateWith([ELaw.SIX_SKIP], track, { a: 4, b: 0 }), 1, { value: 2, values: [2, 6] }));

    expect(next.G.players.a.skipTurns).toBe(1);
  });

  it('«Шестёрка»: без шестёрки ничего', () => {
    const next = land(afterRoll(stateWith([ELaw.SIX_SKIP], track, { a: 4, b: 0 }), 1, { value: 5 }));

    expect(next.G.players.a.skipTurns).toBe(0);
  });

  it('«Дубль»: одинаковые кубики — ходит ещё раз', () => {
    const state = stateWith([ELaw.DOUBLE_AGAIN], track, { a: 4, b: 0 });
    const next = land(afterRoll(state, 1, { value: 3, values: [3, 3] }));

    expect(next.ctx.currentPlayer).toBe('a');
  });

  it('«Дубль»: разные кубики — ход переходит', () => {
    const state = stateWith([ELaw.DOUBLE_AGAIN], track, { a: 4, b: 0 });
    const next = land(afterRoll(state, 1, { value: 3, values: [3, 4] }));

    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('законы броска не срабатывают, если ход не начинался броском', () => {
    const next = land(stateWith([ELaw.SIX_SKIP], track, { a: 4, b: 0 }));

    expect(next.G.players.a.skipTurns).toBe(0);
  });
});

describe('законы начала и конца хода', () => {
  const track = empties(10);

  it('«Пособие»: отстающий получает 3', () => {
    const next = startTurn(stateWith([ELaw.LAST_START_RESOURCE], track, { a: 0, b: 3 }));

    expect(next.G.players.a.resource).toBe(13);
    expect(next.ctx.phase).toBe(EPhase.ROLL);
  });

  it('«Пособие»: ничья по позиции — не срабатывает', () => {
    const next = startTurn(stateWith([ELaw.LAST_START_RESOURCE], track, { a: 2, b: 2 }));

    expect(next.G.players.a.resource).toBe(10);
  });

  it('«Пособие»: не отстающий не получает', () => {
    const next = startTurn(stateWith([ELaw.LAST_START_RESOURCE], track, { a: 3, b: 0 }));

    expect(next.G.players.a.resource).toBe(10);
  });

  it('«Удача отстающего»: событие, потом бросок у того же игрока', () => {
    const paused = startTurn(stateWith([ELaw.LAST_START_GOOD], track, { a: 0, b: 3 }, 10, { 5: goodEvent(5) }));

    expect(paused.ctx.phase).toBe(EPhase.CHOICE);

    const next = choose(paused);

    expect(next.ctx.phase).toBe(EPhase.ROLL);
    expect(next.ctx.currentPlayer).toBe('a');
    expect(next.G.players.a.resource).toBe(12);
  });

  it('«Попутный ветер»: отстающий проходит 5 клеток, затем ход у второго', () => {
    const next = proceed(atEnd(stateWith([ELaw.LAST_END_ADVANCE], track, { a: 0, b: 3 })));

    expect(next.G.players.a.position).toBe(5);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Попутный ветер»: у сейфа игрок не двигается', () => {
    const next = proceed(atEnd(stateWith([ELaw.LAST_END_ADVANCE], track, { a: 11, b: 11 })));

    expect(next.G.players.a.position).toBe(11);
  });

  it('«Лотерея»: Ресурс растёт на выпавшее число, в ленте оно записано', () => {
    const next = proceed(atEnd(stateWith([ELaw.LAST_END_DIE], track, { a: 0, b: 3 })));
    const gained = next.G.players.a.resource - 10;

    expect(gained).toBeGreaterThanOrEqual(1);
    expect(gained).toBeLessThanOrEqual(6);
    expect(next.G.log).toContain(`закон «Лотерея»: Аня — выпало ${gained}, монеты +${gained}`);
  });

  it('законы конца хода не срабатывают у не отстающего', () => {
    const next = proceed(atEnd(stateWith([ELaw.LAST_END_DIE], track, { a: 3, b: 0 })));

    expect(next.G.players.a.resource).toBe(10);
  });
});
