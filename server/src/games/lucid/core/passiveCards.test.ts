import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { land } from '@/games/lucid/core/turn';
import { pickDie, rollAndMove } from '@/games/lucid/core/moves';

const { ECellType, ELaw, EShopCard } = LucidShared;

const colorTrack = (types: LucidShared.ECellType[]): LucidShared.TTrack => ({
  startId: 0,
  finishId: types.length + 1,
  cells: [
    { id: 0, type: ECellType.START, next: [1] },
    ...types.map((type, index) => ({ id: index + 1, type, next: [index + 2] })),
    { id: types.length + 1, type: ECellType.FINISH, next: [] },
  ],
});

const empties = (count: number): LucidShared.ECellType[] => Array.from({ length: count }, () => ECellType.EMPTY);

const stateWith = (
  types: LucidShared.ECellType[],
  hand: LucidShared.EShopCard[],
  laws: LucidShared.ELaw[] = [],
  position = 1,
): LucidShared.TState => {
  const G = makeG({
    track: colorTrack(types),
    players: [
      { id: 'a', nickname: 'Аня', position, resource: 10 },
      { id: 'b', nickname: 'Боря', position: 0, resource: 10 },
    ],
  });

  return {
    G: {
      ...G,
      cards: {
        ...G.cards,
        laws: [...laws, null, null, null].slice(0, 3),
        hands: { a: hand.map((card, uid) => ({ uid, card })) },
      },
    },
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
    stateId: 0,
  };
};

describe('пассивные карты на клетке', () => {
  it('«Громоотвод» на красной: +5', () => {
    const next = land(stateWith([ECellType.RED], [EShopCard.MONEY_MAGNET]));

    expect(next.G.players.a.resource).toBe(15);
  });

  it('«Громоотвод» на пустой ничего не даёт', () => {
    const next = land(stateWith([ECellType.EMPTY], [EShopCard.MONEY_MAGNET]));

    expect(next.G.players.a.resource).toBe(10);
  });

  it('«Подкова» на пустой: +4', () => {
    const next = land(stateWith([ECellType.EMPTY], [EShopCard.CLOVER]));

    expect(next.G.players.a.resource).toBe(14);
  });

  it('две «Подковы»: +8', () => {
    const next = land(stateWith([ECellType.EMPTY], [EShopCard.CLOVER, EShopCard.CLOVER]));

    expect(next.G.players.a.resource).toBe(18);
  });

  it('«Попутка»: 4 клетки вперёд, на новой пустой вторая «Попутка» не срабатывает', () => {
    const next = land(stateWith(empties(12), [EShopCard.TRAVELATOR, EShopCard.TRAVELATOR]));

    expect(next.G.players.a.position).toBe(5);
    expect(next.G.log.filter(line => line.includes('Попутка'))).toHaveLength(1);
  });

  it('«Попутка» на пустую: «Подкова» срабатывает один раз на клетке остановки', () => {
    const next = land(stateWith(empties(12), [EShopCard.TRAVELATOR, EShopCard.CLOVER]));

    expect(next.G.players.a.position).toBe(5);
    expect(next.G.players.a.resource).toBe(14);
    expect(next.G.log.filter(line => line.includes('Подкова'))).toHaveLength(1);
  });

  it('закон на красной срабатывает раньше «Громоотвода»', () => {
    const next = land(stateWith([ECellType.RED], [EShopCard.MONEY_MAGNET], [ELaw.RED_BAD]));

    expect(next.G.log.findIndex(line => line.includes('закон'))).toBeLessThan(
      next.G.log.findIndex(line => line.includes('Громоотвод')),
    );
    expect(next.G.players.a.resource).toBeGreaterThanOrEqual(15);
  });
});

describe('порядок строк ленты при сдвиге на портал', () => {
  it('«Попутка» на портал: строка карты стоит перед «проходит портал»', () => {
    const state = stateWith(empties(12), [EShopCard.TRAVELATOR]);
    const cells = state.G.track.cells.map(cell => {
      if (cell.id === 5) {
        return { ...cell, type: ECellType.PORTAL, portal: { pair: 0, to: 10 } };
      }

      return cell.id === 10 ? { ...cell, type: ECellType.PORTAL, portal: { pair: 0, to: 5 } } : cell;
    });
    const next = land({ ...state, G: { ...state.G, track: { ...state.G.track, cells } } });
    const lines = next.G.log;

    expect(next.G.players.a.position).toBe(10);
    expect(lines.findIndex(line => line.includes('Попутка'))).toBeGreaterThanOrEqual(0);
    expect(lines.findIndex(line => line.includes('Попутка'))).toBeLessThan(
      lines.findIndex(line => line.includes('проходит портал')),
    );
  });
});

describe('«Утяжелённый кубик»', () => {
  it('один кубик: показывает выпавшее, идёт на число + 1', () => {
    const state = stateWith(empties(30), [EShopCard.MAGIC_DIE], [], 0);
    const next = rollAndMove(state.G, 'a');

    expect(next.players.a.position).toBe((next.lastRoll?.value ?? 0) + 1);
    expect(next.log.at(-1)).toBe(`Аня выбрасывает ${next.lastRoll?.value} (+1 от карт)`);
  });

  it('два кубика: бонус к выбранному', () => {
    const state = stateWith(empties(30), [EShopCard.MAGIC_DIE], [], 15);
    const rolled = rollAndMove(state.G, 'a');
    const picked = pickDie(rolled, 'a', 1);

    expect(rolled.lastRoll?.values).toHaveLength(2);
    expect(picked?.players.a.position).toBe(15 + (rolled.lastRoll?.values?.[1] ?? 0) + 1);
    expect(picked?.log.at(-1)).toBe(`Аня идёт на ${rolled.lastRoll?.values?.[1]} (+1 от карт)`);
  });

  it('без карты бонуса нет', () => {
    const state = stateWith(empties(30), [], [], 0);
    const next = rollAndMove(state.G, 'a');

    expect(next.players.a.position).toBe(next.lastRoll?.value);
  });
});
