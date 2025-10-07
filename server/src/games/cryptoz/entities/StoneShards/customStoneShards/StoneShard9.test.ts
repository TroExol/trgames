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

import { StoneShard9 } from './StoneShard9';

describe('StoneShard9', () => {
  let stoneShard: StoneShard9;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard9(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard9();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(9);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard9(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(9);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Нанеси 8 урона атакующему');
  });

  it('Можно разыграть всегда, если атакующий не владелец', () => {
    expect(stoneShard.canPlayHandler(player)).toBeTruthy();
  });

  it('Разыгрывается и наносит 8 урона владельцу', async () => {
    const initialHealth = player.health;
    const initialHealthActivePlayer = activePlayer.health;

    await stoneShard.play(player);

    expect(player.health).toBe(initialHealth - 8);
    expect(activePlayer.health).toBe(initialHealthActivePlayer);
  });
});
