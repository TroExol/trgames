import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  assignPremises,
  assignRegionNames,
  PREMISE_LAST,
  PREMISE_LEADER,
} from '@/games/lucid/generation/premises';

const CELL_IDS = Array.from({ length: 48 }, (_unused, index) => index + 1);

describe('assignPremises', () => {
  it('детерминирована по сиду партии', () => {
    const first = assignPremises(CELL_IDS, 'party-1');
    const second = assignPremises(CELL_IDS, 'party-1');

    expect(second).toEqual(first);
  });

  it('другой сид даёт другую раскладку', () => {
    const first = assignPremises(CELL_IDS, 'party-1');
    const second = assignPremises(CELL_IDS, 'party-2');

    expect(second.map(item => item.premise)).not.toEqual(first.map(item => item.premise));
  });

  it('доли «удар по лидеру» и «помощь отстающему» — около четверти клеток каждая', () => {
    const assigned = assignPremises(CELL_IDS, 'shares');
    const leaderCount = assigned.filter(item => item.premise === PREMISE_LEADER).length;
    const lastCount = assigned.filter(item => item.premise === PREMISE_LAST).length;

    expect(leaderCount).toBeGreaterThanOrEqual(Math.round(CELL_IDS.length / 4) - 1);
    expect(leaderCount).toBeLessThanOrEqual(Math.round(CELL_IDS.length / 4) + 1);
    expect(lastCount).toBeGreaterThanOrEqual(Math.round(CELL_IDS.length / 4) - 1);
    expect(lastCount).toBeLessThanOrEqual(Math.round(CELL_IDS.length / 4) + 1);
  });

  it('у завязки «удар по лидеру» цель FIRST, у «помощь отстающему» — LAST, у остальных цели нет', () => {
    const assigned = assignPremises(CELL_IDS, 'targets');

    assigned.forEach(item => {
      if (item.premise === PREMISE_LEADER) {
        expect(item.target).toBe(LucidShared.ETarget.FIRST);
      } else if (item.premise === PREMISE_LAST) {
        expect(item.target).toBe(LucidShared.ETarget.LAST);
      } else {
        expect(item.target).toBeUndefined();
      }
    });
  });

  it('у соседних клеток завязки разные', () => {
    const assigned = assignPremises(CELL_IDS, 'neighbours');

    for (let i = 1; i < assigned.length; i++) {
      expect(assigned[i].premise).not.toBe(assigned[i - 1].premise);
    }
  });

  it('пустой список клеток не падает', () => {
    expect(assignPremises([], 'empty')).toEqual([]);
  });
});

describe('assignRegionNames', () => {
  const regions: LucidShared.TRegion[] = [
    { name: 'Старт', color: '#111111' },
    { name: 'Середина', color: '#222222' },
    { name: 'Финиш', color: '#333333' },
  ];

  const track: LucidShared.TTrack = {
    startId: 0,
    finishId: 4,
    cells: [
      { id: 0, type: LucidShared.ECellType.START, next: [1] },
      { id: 1, type: LucidShared.ECellType.EVENT, next: [2] },
      { id: 2, type: LucidShared.ECellType.EVENT, next: [3] },
      { id: 3, type: LucidShared.ECellType.EVENT, next: [4] },
      { id: 4, type: LucidShared.ECellType.FINISH, next: [] },
    ],
  };

  it('начало пути получает первый край, конец — последний', () => {
    // Глубина 4 (finishId) — максимальная в этом треке, поэтому именно она
    // должна попасть в последний край; depth 1 — в первый
    const names = assignRegionNames([1, 4], track, regions);

    expect(names[1]).toBe('Старт');
    expect(names[4]).toBe('Финиш');
  });

  it('без краёв возвращает пустую строку, а не падает', () => {
    expect(assignRegionNames([1], track, [])[1]).toBe('');
  });
});
