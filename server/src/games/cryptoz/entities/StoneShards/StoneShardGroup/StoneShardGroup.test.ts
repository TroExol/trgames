import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';

import { EStoneShardGroupType } from './types';
import { StoneShardGroup } from './StoneShardGroup';

describe('StoneShardGroup', () => {
  let stoneShardGroup: StoneShardGroup<EStoneShardGroupType.ANY>;

  beforeEach(() => {
    stoneShardGroup = new StoneShardGroup(EStoneShardGroupType.ANY);
  });

  it('Инстанс создается', () => {
    expect(stoneShardGroup).toBeInstanceOf(StoneShardGroup);
  });

  it('Добавляет осколки Философского камня', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();
    const stoneShard3 = new StoneShard1();

    stoneShardGroup.addStoneShardToTop(stoneShard1);
    expect(stoneShardGroup.top).toBe(stoneShard1);
    expect(stoneShardGroup.bottom).toBe(stoneShard1);
    expect(stoneShardGroup.count).toBe(1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);
    expect(stoneShardGroup.top).toBe(stoneShard1);
    expect(stoneShardGroup.bottom).toBe(stoneShard2);
    expect(stoneShardGroup.count).toBe(2);
    stoneShardGroup.addStoneShardToTop(stoneShard3);
    expect(stoneShardGroup.top).toBe(stoneShard3);
    expect(stoneShardGroup.bottom).toBe(stoneShard2);
    expect(stoneShardGroup.count).toBe(3);
  });

  it('Удаляет осколки', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);

    expect(stoneShardGroup.removeStoneShard(stoneShard1)).toBe(stoneShard1);
    expect(stoneShardGroup.count).toBe(1);
    expect(stoneShardGroup.getStoneShard(stoneShard1)).toBeNull();
    expect(stoneShardGroup.getStoneShard(stoneShard2)).toBe(stoneShard2);
    expect(stoneShardGroup.removeStoneShard(stoneShard1)).toBeNull();
    expect(stoneShardGroup.count).toBe(1);
  });

  it('Удаляет осколки по id', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);

    expect(stoneShardGroup.removeStoneShardsById(1).count).toBe(2);
    expect(stoneShardGroup.count).toBe(0);
    expect(stoneShardGroup.removeStoneShardsById(1).count).toBe(0);
    expect(stoneShardGroup.count).toBe(0);
  });

  it('Удаляет осколки снизу', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();
    const stoneShard3 = new StoneShard1();

    stoneShardGroup.addStoneShardToTop(stoneShard1);
    stoneShardGroup.addStoneShardToTop(stoneShard2);
    stoneShardGroup.addStoneShardToTop(stoneShard3);

    expect(stoneShardGroup.removeStoneShardsFromTop(2).array).toEqual([stoneShard2, stoneShard3]);
    expect(stoneShardGroup.count).toBe(1);
    expect(stoneShardGroup.getStoneShard(stoneShard1)).toBe(stoneShard1);
    expect(stoneShardGroup.getStoneShard(stoneShard2)).toBeNull();
    expect(stoneShardGroup.getStoneShard(stoneShard3)).toBeNull();
    expect(stoneShardGroup.removeStoneShardsFromTop(2).array).toEqual([stoneShard1]);
    expect(stoneShardGroup.count).toBe(0);
  });

  it('Удаляет осколки сверху', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();
    const stoneShard3 = new StoneShard1();

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);
    stoneShardGroup.addStoneShardToBottom(stoneShard3);

    expect(stoneShardGroup.removeStoneShardsFromBottom(2).array).toEqual([stoneShard3, stoneShard2]);
    expect(stoneShardGroup.count).toBe(1);
    expect(stoneShardGroup.getStoneShard(stoneShard1)).toBe(stoneShard1);
    expect(stoneShardGroup.getStoneShard(stoneShard2)).toBeNull();
    expect(stoneShardGroup.getStoneShard(stoneShard3)).toBeNull();
    expect(stoneShardGroup.removeStoneShardsFromBottom(2).array).toEqual([stoneShard1]);
    expect(stoneShardGroup.count).toBe(0);
  });

  it('Перемешивает осколки', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    stoneShardGroup.shuffle();
    expect(stoneShardGroup.array).toEqual([]);

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.shuffle();
    expect(stoneShardGroup.array).toEqual([stoneShard1]);

    stoneShardGroup.addStoneShardToBottom(stoneShard2);
    stoneShardGroup.shuffle();
    expect(stoneShardGroup.count).toBe(2);
  });

  it('Перемешивает осколки, не мутируя исходную группу', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    const shuffled1 = stoneShardGroup.toShuffle();
    expect(stoneShardGroup.array).toEqual([]);
    expect(shuffled1.array).toEqual([]);
    expect(stoneShardGroup).not.toBe(shuffled1);

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    const shuffled2 = stoneShardGroup.toShuffle();
    expect(stoneShardGroup.array).toEqual([stoneShard1]);
    expect(shuffled2.array).toEqual([stoneShard1]);

    stoneShardGroup.addStoneShardToBottom(stoneShard2);
    const shuffled3 = stoneShardGroup.toShuffle();
    expect(stoneShardGroup.count).toBe(2);
    expect(stoneShardGroup.array).toEqual([stoneShard2, stoneShard1]);
    expect(shuffled3.count).toBe(2);
  });

  it('Получение осколков работает корректно', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    expect(stoneShardGroup.getStoneShard(stoneShard1)).toBeNull();
    expect(stoneShardGroup.randomStoneShard).toBeNull();
    expect(stoneShardGroup.getStoneShardsById(1).array).toEqual([]);

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);

    expect(stoneShardGroup.getStoneShard(stoneShard1)).toBe(stoneShard1);
    expect(stoneShardGroup.getStoneShardsById(1).array).toEqual([stoneShard2, stoneShard1]);
    expect(stoneShardGroup.getStoneShardsExceptStoneShard(stoneShard2).array).toEqual([stoneShard1]);
    expect(stoneShardGroup.array.includes(stoneShardGroup.randomStoneShard!)).toBeTruthy();
    expect(stoneShardGroup.getStoneShardByUuid(stoneShard1.uuid)).toBe(stoneShard1);
    expect(stoneShardGroup.getStoneShardByUuid('asd')).toBeNull();
    expect(stoneShardGroup.getStoneShardById(1)).toBe(stoneShard2);
  });

  it('Получение количества работает корректно', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    expect(stoneShardGroup.getCountStoneShardsById(1)).toBe(0);

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);

    expect(stoneShardGroup.getCountStoneShardsById(1)).toBe(2);
    expect(stoneShardGroup.count).toBe(2);
  });

  it('Очищается', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);

    stoneShardGroup.clear();

    expect(stoneShardGroup.count).toBe(0);
  });

  it('Возвращает список id', () => {
    const stoneShard1 = new StoneShard1();
    const stoneShard2 = new StoneShard1();
    const stoneShard3 = new StoneShard1();

    expect(stoneShardGroup.ids).toEqual([]);

    stoneShardGroup.addStoneShardToBottom(stoneShard1);
    stoneShardGroup.addStoneShardToBottom(stoneShard2);
    stoneShardGroup.addStoneShardToBottom(stoneShard3);

    expect(stoneShardGroup.ids).toEqual([1, 1, 1]);
  });
});
