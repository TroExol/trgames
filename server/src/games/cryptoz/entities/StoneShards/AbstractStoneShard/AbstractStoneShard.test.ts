import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { AbstractStoneShard } from './AbstractStoneShard';

const canPlayHandler = vi.fn().mockReturnValue(true);
const playHandler = vi.fn().mockResolvedValue(true);
const onChangeOwner = vi.fn();

class TestStoneShard extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 1, room });
  }

  canPlayHandler = canPlayHandler;

  protected getDescription = () => '';

  protected onChangeOwner = onChangeOwner;

  protected playHandler = playHandler;
}

describe('AbstractStoneShard', () => {
  let stoneShard: TestStoneShard;
  let activePlayer: Player;
  let player: Player;
  let room: Room;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new TestStoneShard(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new TestStoneShard();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(1);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new TestStoneShard(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(1);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
    expect(stoneShard.room).toBe(room);
  });

  it('Сравнивание работает корректно', () => {
    const otherStoneShard = new TestStoneShard(room);
    expect(stoneShard.theSame(stoneShard)).toBeTruthy();
    expect(stoneShard.theSame(otherStoneShard)).toBeFalsy();
    expect(stoneShard.theSameId(1)).toBeTruthy();
    expect(stoneShard.theSameId(2)).toBeFalsy();
  });

  it('Владелец определяется конкретно', () => {
    expect(stoneShard.owner).toBeNull();
    stoneShard.changeOwner(activePlayer.nickname);
    expect(stoneShard.owner).toBe(activePlayer);
    expect(onChangeOwner).toHaveBeenCalledTimes(1);
  });

  it('Форматирует корректно', () => {
    const formattedStoneShard = stoneShard.format();
    expect(formattedStoneShard).toEqual({
      uuid: stoneShard.uuid,
      id: stoneShard.id,
      description: '',
      ownerNickname: stoneShard.ownerNickname,
    });
  });

  describe('play', () => {
    it('Осколок Философского камня разыгрывается', async () => {
      stoneShard.changeOwner(activePlayer.nickname);
      activePlayer.stoneShards.addStoneShardToTop(stoneShard);
      await stoneShard.play(player);
      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть осколок, пока он разыгрывается', async () => {
      stoneShard.changeOwner(activePlayer.nickname);
      activePlayer.stoneShards.addStoneShardToTop(stoneShard);
      const playingCard = stoneShard.play(player);
      await stoneShard.play(player);
      await playingCard;
      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть, если закончилась игра', async () => {
      room.isGameEnded = true;
      stoneShard.changeOwner(activePlayer.nickname);
      activePlayer.stoneShards.addStoneShardToTop(stoneShard);
      await stoneShard.play(player);
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Нельзя разыграть, если нет активного участника', async () => {
      room.activePlayerNickname = undefined;
      stoneShard.changeOwner(activePlayer.nickname);
      activePlayer.stoneShards.addStoneShardToTop(stoneShard);
      await stoneShard.play(player);
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Нельзя разыграть, если нет у участника', async () => {
      stoneShard.changeOwner(activePlayer.nickname);
      await stoneShard.play(player);
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Если нельзя разыграть обработчик', async () => {
      canPlayHandler.mockReturnValueOnce(false);
      stoneShard.changeOwner(activePlayer.nickname);
      activePlayer.stoneShards.addStoneShardToTop(stoneShard);
      await stoneShard.play(player);
      expect(playHandler).toHaveBeenCalledTimes(0);
    });
  });
});
