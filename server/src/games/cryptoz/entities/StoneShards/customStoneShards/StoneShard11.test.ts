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
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { StoneShard11 } from './StoneShard11';

describe('StoneShard11', () => {
  let stoneShard: StoneShard11;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard11(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard11();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(11);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard11(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(11);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Уничтожь случайную карту на руке');
  });

  it('Нельзя разыграть если рука пустая', () => {
    activePlayer.hand.clear();
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если в руке есть карты', () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.hand.addCardToTop(card);
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и уничтожает случайную карту из руки', async () => {
    const card1 = new MockCard({ room, name: 'Тестовая карта 1' });
    const card2 = new MockCard({ room, name: 'Тестовая карта 2' });
    const card3 = new MockCard({ room, name: 'Тестовая карта 3' });

    activePlayer.hand.addCardToTop(card1);
    activePlayer.hand.addCardToTop(card2);
    activePlayer.hand.addCardToTop(card3);

    const initialHandCount = activePlayer.hand.count;
    const initialRemovedCount = room.removed.cards.count;

    await stoneShard.play(player);

    expect(activePlayer.hand.count).toBe(initialHandCount - 1);
    expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
  });
});
