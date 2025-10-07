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

import { StoneShard6 } from './StoneShard6';

describe('StoneShard6', () => {
  let stoneShard: StoneShard6;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard6(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard6();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(6);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard6(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(6);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Уничтожь случайную карту из сброса');
  });

  it('Нельзя разыграть если сброс пустой', () => {
    activePlayer.discard.clear();
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если в сбросе есть карты', () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.discard.addCardToTop(card);
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и уничтожает случайную карту из сброса', async () => {
    const card1 = new MockCard({ room, name: 'Тестовая карта 1' });
    const card2 = new MockCard({ room, name: 'Тестовая карта 2' });
    const card3 = new MockCard({ room, name: 'Тестовая карта 3' });

    activePlayer.discard.addCardToTop(card1);
    activePlayer.discard.addCardToTop(card2);
    activePlayer.discard.addCardToTop(card3);

    const initialDiscardCount = activePlayer.discard.count;
    const initialRemovedCount = room.removed.cards.count;

    await stoneShard.play(player);

    expect(activePlayer.discard.count).toBe(initialDiscardCount - 1);
    expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
  });
});
