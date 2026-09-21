import {
  describe,
  expect,
  it,
} from 'vitest';

import { forkTrack, lineTrack } from '@/games/lucid/vitest/factories';
import { moveBy, walkForward } from '@/games/lucid/core/movement';

describe('walkForward', () => {
  it('проходит вперёд заданное число шагов', () => {
    expect(walkForward(lineTrack(), 0, 2)).toEqual({
      position: 2,
      stepsLeft: 0,
      branchChoices: [],
    });
  });

  it('упирается в финиш и не идёт дальше', () => {
    expect(walkForward(lineTrack(), 0, 99).position).toBe(4);
  });

  it('останавливается на развилке и сообщает остаток шагов', () => {
    expect(walkForward(forkTrack(), 0, 4)).toEqual({
      position: 1,
      stepsLeft: 3,
      branchChoices: [2, 4],
    });
  });

  it('стоя на развилке, предлагает выбор с первого же шага', () => {
    expect(walkForward(forkTrack(), 1, 2)).toEqual({
      position: 1,
      stepsLeft: 2,
      branchChoices: [2, 4],
    });
  });

  it('пройдя развилку, идёт до конца без остановок', () => {
    // От клетки 2 три шага по связям: 2→3→6→7, конечная клетка — финиш
    expect(walkForward(forkTrack(), 2, 3)).toEqual({
      position: 7,
      stepsLeft: 0,
      branchChoices: [],
    });
  });
});

describe('moveBy', () => {
  it('двигает вперёд по связям, а не по номерам клеток', () => {
    // Из клетки 3 прибавление единицы к номеру дало бы клетку 4 — чужую ветку.
    // По связям правильный ответ — клетка схождения 6
    expect(moveBy(forkTrack(), 3, 1)).toBe(6);
  });

  it('на развилке принудительное перемещение идёт первой веткой', () => {
    expect(moveBy(forkTrack(), 1, 1)).toBe(2);
  });

  it('двигает назад по связям', () => {
    expect(moveBy(forkTrack(), 6, 2)).toBe(7);
    expect(moveBy(forkTrack(), 6, -2)).toBe(2);
  });

  it('не уходит за старт', () => {
    expect(moveBy(lineTrack(), 1, -10)).toBe(0);
  });

  it('не уходит за финиш', () => {
    expect(moveBy(lineTrack(), 3, 10)).toBe(4);
  });

  it('нулевое значение ничего не меняет', () => {
    expect(moveBy(lineTrack(), 2, 0)).toBe(2);
  });
});
