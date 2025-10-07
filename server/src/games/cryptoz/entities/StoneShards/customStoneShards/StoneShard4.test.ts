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
import {
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { StoneShard4 } from './StoneShard4';

describe('StoneShard4', () => {
  let stoneShard: StoneShard4;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard4(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard4();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(4);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard4(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(4);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Разыграй тотальный мракобой текущего предвестника против себя');
  });

  it('Нельзя разыграть если нет предвестника', () => {
    room.harbingers.clear();
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если есть предвестник', () => {
    const mockHarbinger = new MockCard({ room, name: 'Тестовый предвестник' });
    mockHarbinger.playTotalDarknessStrike = vi.fn().mockResolvedValue(undefined);
    room.harbingers.addCardToTop(mockHarbinger);
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и вызывает тотальный мракобой предвестника', async () => {
    const mockHarbinger = new MockCard({ room, name: 'Тестовый предвестник' });
    mockHarbinger.playTotalDarknessStrike = vi.fn().mockResolvedValue(undefined);
    room.harbingers.addCardToTop(mockHarbinger);

    await stoneShard.play(player);

    expect(mockHarbinger.playTotalDarknessStrike).toHaveBeenCalledWith({ target: activePlayer });
  });
});
