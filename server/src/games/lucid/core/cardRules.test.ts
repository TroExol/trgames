import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { withTurn } from '@/games/lucid/core/turn';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';
import { playCard } from '@/games/lucid/core/playCard';

const { ECellType, EPhase, EShopCard } = LucidShared;

const LENGTH = 20;

const track: LucidShared.TTrack = {
  startId: 0,
  finishId: LENGTH + 1,
  cells: [
    { id: 0, type: ECellType.START, next: [1] },
    ...Array.from({ length: LENGTH }, (_, index) => ({ id: index + 1, type: ECellType.EMPTY, next: [index + 2] })),
    { id: LENGTH + 1, type: ECellType.FINISH, next: [] },
  ],
};

const badEvent = (cellId: number): LucidShared.TEvent => ({
  cellId,
  title: 'Напасть',
  text: 'Беда',
  options: [{
    text: 'Терпеть',
    success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: -2 }] },
  }],
});

const cardsState = (
  positions: Record<string, number>,
  hand: LucidShared.EShopCard[],
  resource = 10,
  events: Record<number, LucidShared.TEvent> = {},
  customTrack: LucidShared.TTrack = track,
): LucidShared.TState => {
  const G = makeG({
    track: customTrack,
    events,
    players: Object.entries(positions).map(([id, position]) => ({ id, nickname: id, position, resource })),
  });

  return {
    G: withTurn(
      { ...G, cards: { ...G.cards, hands: { a: hand.map((card, uid) => ({ uid, card })) } } },
      { step: LucidShared.ETurnStep.CARDS },
    ),
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: Object.keys(positions).length, phase: EPhase.CARDS },
    stateId: 0,
  };
};

const trackWith = (
  patch: Record<number, Partial<LucidShared.TCell>>,
): LucidShared.TTrack => ({
  ...track,
  cells: track.cells.map(cell => ({ ...cell, ...patch[cell.id] })),
});

const portals = (a: number, b: number): Record<number, Partial<LucidShared.TCell>> => ({
  [a]: { type: ECellType.PORTAL, portal: { pair: 0, to: b } },
  [b]: { type: ECellType.PORTAL, portal: { pair: 0, to: a } },
});

describe('canPlay', () => {
  const check = (positions: Record<string, number>, card: LucidShared.EShopCard): boolean => {
    const state = cardsState(positions, [card]);

    return LucidShared.canPlay(state.G, 'a', state.G.cards.hands.a[0]);
  };

  it('«Обвал» без игроков впереди — нельзя', () => {
    expect(check({ a: 9, b: 2 }, EShopCard.GRENADE)).toBe(false);
    expect(check({ a: 2, b: 9 }, EShopCard.GRENADE)).toBe(true);
  });

  it('«Аркан» с ближайшим впереди в 12 клетках — нельзя', () => {
    expect(check({ a: 2, b: 14 }, EShopCard.HARPOON)).toBe(false);
  });

  it('«Рывок» на финише — нельзя', () => {
    expect(check({ a: LENGTH + 1, b: 0 }, EShopCard.ROCKET)).toBe(false);
  });
});

describe('nearestAhead', () => {
  it('находит ближайшего впереди', () => {
    const { G } = cardsState({ a: 2, b: 9 }, []);

    expect(LucidShared.nearestAhead(G, 'a')).toEqual({ id: 'b', distance: 7 });
  });

  it('позади никого — undefined', () => {
    const { G } = cardsState({ a: 9, b: 2 }, []);

    expect(LucidShared.nearestAhead(G, 'a')).toBeUndefined();
  });

  it('игрок у сейфа не считается', () => {
    const { G } = cardsState({ a: 2, b: LENGTH + 1 }, []);

    expect(LucidShared.nearestAhead(G, 'a')).toBeUndefined();
  });
});

describe('активные карты', () => {
  it('«Рывок»: +5 клеток, Ресурс цел, карта в сбросе, фаза карт снова, если есть ещё карта', () => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET, EShopCard.ROCKET]);
    const next = playCard(state, 0)!;

    expect(next.G.players.a.position).toBe(7);
    expect(next.G.players.a.resource).toBe(10);
    expect(next.G.cards.hands.a.map(item => item.uid)).toEqual([1]);
    expect(next.G.cards.shopDiscard.map(item => item.uid)).toEqual([0]);
    expect(next.G.turn.used).toContain(0);
    expect(next.ctx.phase).toBe(EPhase.CARDS);
  });

  it('«Рывок» последний: ход переходит к b', () => {
    const next = playCard(cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET]), 0)!;

    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Рывок» вторым разом в тот же ход — null', () => {
    const next = playCard(cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET, EShopCard.ROCKET]), 0)!;

    expect(playCard(next, 0)).toBeNull();
  });

  it('Ресурс 0 — карта всё равно играется', () => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET], 0);
    const next = playCard(state, 0)!;

    expect(LucidShared.canPlay(state.G, 'a', state.G.cards.hands.a[0])).toBe(true);
    expect(next.G.players.a.resource).toBe(0);
    expect(next.G.cards.shopDiscard.map(item => item.uid)).toEqual([0]);
  });

  it('«Обвал»: b впереди на 9 отступает на 3', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.GRENADE]), 0)!;

    expect(next.G.players.b.position).toBe(3);
  });

  it('«Кошка»: a встаёт на клетку b', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.HOOK]), 0)!;

    expect(next.G.players.a.position).toBe(9);
  });

  it.each([ECellType.EVENT, ECellType.SHOP, ECellType.LAW])('«Рывок» на клетку %s: клетка не срабатывает', type => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET], 10, { 7: badEvent(7) }, trackWith({ 7: { type } }));
    const next = playCard(state, 0)!;

    expect(next.G.players.a.position).toBe(7);
    expect([EPhase.CHOICE, EPhase.SHOP, EPhase.LAW]).not.toContain(next.ctx.phase);
    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('«Рывок» на портал переносит на парную клетку', () => {
    const next = playCard(cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET], 10, {}, trackWith(portals(7, 15))), 0)!;

    expect(next.G.players.a.position).toBe(15);
    expect(next.G.log).toContain('a проходит портал');
  });

  it('«Обвал» отбрасывает жертву на портал: жертва на парной клетке', () => {
    const state = cardsState({ a: 2, b: 9 }, [EShopCard.GRENADE], 10, {}, trackWith(portals(3, 15)));
    const next = playCard(state, 0)!;

    expect(next.G.players.b.position).toBe(15);
    expect(next.G.visited).toContain(15);
  });

  it('«Кошка» на клетку игрока, который стоит на портале, — переноса нет', () => {
    const state = cardsState({ a: 2, b: 9 }, [EShopCard.HOOK], 10, {}, trackWith(portals(9, 15)));
    const next = playCard(state, 0)!;

    expect(next.G.players.a.position).toBe(9);
    expect(next.G.log.some(line => line.includes('проходит портал'))).toBe(false);
  });

  it('«Кошка» не играется при расстоянии 13', () => {
    expect(playCard(cardsState({ a: 2, b: 15 }, [EShopCard.HOOK]), 0)).toBeNull();
  });

  it('«Аркан»: b встаёт на клетку a', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.HARPOON]), 0)!;

    expect(next.G.players.b.position).toBe(2);
  });

  it('«Порча»: b проклят и в начале хода разыгрывает беду', () => {
    const state = cardsState({ a: 2, b: 9 }, [EShopCard.VOODOO], 10, { 5: badEvent(5) });
    const next = playCard(state, 0)!;

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(EPhase.CHOICE);
    expect(next.G.turn.eventCellId).toBe(5);
    expect(next.G.players.b.cursed).toBe(0);
  });

  it('«Порча» без бед в партии: строка в ленту, ход идёт дальше', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.VOODOO]), 0)!;

    expect(next.ctx.phase).toBe(EPhase.ROLL);
    expect(next.G.log.some(line => line.includes('порча не нашла беды'))).toBe(true);
  });

  it('«Толчок»: цель c на 6 уходит на 2, карта уходит в сброс', () => {
    const state = cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE]);
    const next = playCard(state, 0, 'c')!;

    expect(next.G.players.c.position).toBe(2);
    expect(next.G.players.a.resource).toBe(10);
    expect(next.G.cards.hands.a).toHaveLength(0);
    expect(next.G.cards.shopDiscard).toHaveLength(1);
  });

  it('«Толчок»: без цели и на себя — null', () => {
    const state = cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE]);

    expect(playCard(state, 0)).toBeNull();
    expect(playCard(state, 0, 'a')).toBeNull();
  });

  it('«Толчок»: чужой ключ вместо id игрока — null, состояние прежнее', () => {
    const state = cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE]);

    expect(playCard(state, 0, 'constructor')).toBeNull();
    expect(state.G.players.a.resource).toBe(10);
  });

  it('«Порча» с недоступной бедой: ход b идёт дальше', () => {
    const event = badEvent(5);

    event.options[0].cost = 99;

    const state = cardsState({ a: 2, b: 9 }, [EShopCard.VOODOO], 10, { 5: event });
    const next = playCard(state, 0)!;

    expect(next.ctx.currentPlayer).toBe('b');
    expect(next.ctx.phase).toBe(EPhase.ROLL);
    expect(next.G.players.b.cursed).toBe(0);
    expect(next.G.log.some(line => line.includes('не по карману'))).toBe(true);
  });

  it('END_TURN в фазе карт передаёт ход b', () => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET]);
    const next = applyMove(state, { type: EMoveType.END_TURN, playerId: 'a', stateId: 0 });

    expect(next.ctx.currentPlayer).toBe('b');
  });

  it('PLAY_CARD через reducer', () => {
    const state = cardsState({ a: 2, b: 9 }, [EShopCard.GRENADE]);
    const next = applyMove(state, { type: EMoveType.PLAY_CARD, playerId: 'a', stateId: 0, uid: 0 });

    expect(next.G.players.b.position).toBe(3);
  });
});
