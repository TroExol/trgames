import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { StoneShard14 } from './StoneShard14';

describe('StoneShard14', () => {
  let stoneShard: StoneShard14;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard14(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard14();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(14);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard14(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(14);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('У тебя -2 осколка славы');
  });

  it('Всегда можно разыграть', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается успешно', async () => {
    await stoneShard.play(player);
  });

  it('Добавляет модификатор при назначении владельца', () => {
    const initialModifiersCount = activePlayer.modifiersGloryShards.count;

    addStoneShardToPlayer(stoneShard, activePlayer);

    expect(activePlayer.modifiersGloryShards.count).toBe(initialModifiersCount + 1);
  });

  it('Удаляет модификатор при смене владельца', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);
    const modifiersCountWithOwner = activePlayer.modifiersGloryShards.count;

    addStoneShardToPlayer(stoneShard, player);

    expect(activePlayer.modifiersGloryShards.count).toBe(modifiersCountWithOwner - 1);
    expect(player.modifiersGloryShards.count).toBe(1);
  });

  it('Модификатор уменьшает осколки славы на 2', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Симулируем базовое значение осколков славы
    const baseGloryShards = 10;
    const expectedGloryShards = baseGloryShards - 2;

    // Применяем модификаторы
    let result = baseGloryShards;
    activePlayer.modifiersGloryShards.array.forEach(modifier => {
      result = modifier.modifier(result);
    });

    expect(result).toBe(expectedGloryShards);
  });
});
