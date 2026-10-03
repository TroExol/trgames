import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { pickDie, rollAndMove } from '@/games/lucid/core/moves';

describe('rollAndMove', () => {
  it('запоминает выпавшую грань', () => {
    const G = makeG({ players: [{ id: 'p1', nickname: 'Аня', position: 0, resource: 3 }] });
    const after = rollAndMove(G, 'p1');

    expect(after.lastRoll?.playerId).toBe('p1');
    expect(after.lastRoll?.value).toBeGreaterThanOrEqual(1);
    expect(after.lastRoll?.value).toBeLessThanOrEqual(6);
  });
});

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

const onTrack = (position: number) => makeG({
  track: straight(31),
  players: [{ id: 'p1', nickname: 'Аня', position, resource: 3 }],
});

describe('зоны кубиков', () => {
  it('зоны трека из 31 клетки: 0 — один кубик, 15 и 30 — выбор', () => {
    const depths = LucidShared.trackDepths(straight(31));
    const zone = (id: number) => LucidShared.diceZoneForDepth(depths[id], depths[30]);

    expect(zone(0)).toBe(LucidShared.EDiceZone.ONE);
    expect(zone(15)).toBe(LucidShared.EDiceZone.PICK);
    expect(zone(22)).toBe(LucidShared.EDiceZone.PICK);
    expect(zone(30)).toBe(LucidShared.EDiceZone.PICK);
  });

  it('в зоне одного кубика двигает на выпавшее', () => {
    const after = rollAndMove(onTrack(0), 'p1');

    expect(after.players.p1.position).toBe(after.lastRoll?.value);
    expect(after.lastRoll?.values).toBeUndefined();
  });

  it('в зоне выбора фишка стоит, два кубика ждут выбора', () => {
    const after = rollAndMove(onTrack(15), 'p1');

    expect(after.players.p1.position).toBe(15);
    expect(after.lastRoll?.pending).toBe(true);
    expect(after.lastRoll?.values).toHaveLength(2);
    after.lastRoll?.values?.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
  });

  it('pickDie двигает на выбранный кубик и заводит новый lastRoll', () => {
    const rolled = rollAndMove(onTrack(15), 'p1');
    const after = pickDie(rolled, 'p1', 1);

    expect(after?.players.p1.position).toBe(15 + (rolled.lastRoll?.values?.[1] ?? 0));
    expect(after?.lastRoll).not.toBe(rolled.lastRoll);
    expect(after?.lastRoll?.picked).toBe(1);
    expect(after?.lastRoll?.pending).toBeUndefined();
  });

  it('pickDie без выбора возвращает null', () => {
    const rolled = rollAndMove(onTrack(15), 'p1');

    expect(pickDie(rolled, 'p1', 2)).toBeNull();
    expect(pickDie(rollAndMove(onTrack(0), 'p1'), 'p1', 0)).toBeNull();
  });
});
