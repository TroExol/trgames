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

import { StoneShard10 } from './StoneShard10';

describe('StoneShard10', () => {
  let stoneShard: StoneShard10;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard10(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard10();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(10);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard10(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(10);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Получи Проклятую печать');
  });

  it('Можно разыграть всегда', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и дает проклятую печать', async () => {
    const initialDiscardCount = activePlayer.discard.count;
    const initialCursedSealsCount = room.cursedSeals.count;

    await stoneShard.play(player);

    expect(activePlayer.discard.count).toBe(initialDiscardCount + 1);
    expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1);
  });
});
