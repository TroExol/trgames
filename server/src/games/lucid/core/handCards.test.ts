import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { withTurn } from '@/games/lucid/core/turn';
import { nearestAhead } from '@/games/lucid/core/targets';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';
import { playCard } from '@/games/lucid/core/playCard';
import { canPlay } from '@/games/lucid/core/handCards';

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
): LucidShared.TState => {
  const G = makeG({
    track,
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

describe('nearestAhead', () => {
  it('находит ближайшего впереди', () => {
    const { G } = cardsState({ a: 2, b: 9 }, []);

    expect(nearestAhead(G, 'a')).toEqual({ id: 'b', distance: 7 });
  });

  it('позади никого — undefined', () => {
    const { G } = cardsState({ a: 9, b: 2 }, []);

    expect(nearestAhead(G, 'a')).toBeUndefined();
  });

  it('игрок у сейфа не считается', () => {
    const { G } = cardsState({ a: 2, b: LENGTH + 1 }, []);

    expect(nearestAhead(G, 'a')).toBeUndefined();
  });
});

describe('активные карты', () => {
  it('«Рывок»: +5 клеток, расход 3, фаза карт снова, если есть ещё карта', () => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET, EShopCard.ROCKET]);
    const next = playCard(state, 0)!;

    expect(next.G.players.a.position).toBe(7);
    expect(next.G.players.a.resource).toBe(7);
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

  it('Ресурс 2 — карта не играется, фазы карт нет', () => {
    const state = cardsState({ a: 2, b: 0 }, [EShopCard.ROCKET], 2);

    expect(canPlay(state.G, 'a', state.G.cards.hands.a[0])).toBe(false);
    expect(playCard(state, 0)).toBeNull();
  });

  it('«Обвал»: b впереди на 9 отступает на 3', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.GRENADE]), 0)!;

    expect(next.G.players.b.position).toBe(3);
  });

  it('«Кошка»: a встаёт на клетку b', () => {
    const next = playCard(cardsState({ a: 2, b: 9 }, [EShopCard.HOOK]), 0)!;

    expect(next.G.players.a.position).toBe(9);
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

  it('«Толчок»: цель c на 6 уходит на 2, карта остаётся в руке', () => {
    const state = cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE]);
    const next = playCard(state, 0, 'c')!;

    expect(next.G.players.c.position).toBe(2);
    expect(next.G.players.a.resource).toBe(7);
    expect(next.G.cards.hands.a).toHaveLength(1);
  });

  it('«Толчок»: без цели, на себя и без Ресурса — null', () => {
    const state = cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE]);

    expect(playCard(state, 0)).toBeNull();
    expect(playCard(state, 0, 'a')).toBeNull();
    expect(playCard(cardsState({ a: 2, b: 3, c: 6 }, [EShopCard.HAND_OF_FATE], 2), 0, 'c')).toBeNull();
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
