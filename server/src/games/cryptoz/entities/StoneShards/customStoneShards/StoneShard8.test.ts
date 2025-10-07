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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { StoneShard8 } from './StoneShard8';

describe('StoneShard8', () => {
  let stoneShard: StoneShard8;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard8(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard8();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(8);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard8(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(8);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Сбрось 3 карты');
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

  it('Разыгрывается и участник выбирает карты для сброса', async () => {
    const card1 = new MockCard({ room, name: 'Тестовая карта 1' });
    const card2 = new MockCard({ room, name: 'Тестовая карта 2' });
    const card3 = new MockCard({ room, name: 'Тестовая карта 3' });
    const card4 = new MockCard({ room, name: 'Тестовая карта 4' });

    activePlayer.hand.addCardToTop(card1);
    activePlayer.hand.addCardToTop(card2);
    activePlayer.hand.addCardToTop(card3);
    activePlayer.hand.addCardToTop(card4);

    const initialHandCount = activePlayer.hand.count;
    const initialDiscardCount = activePlayer.discard.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [card1, card2, card3]),
    });

    await stoneShard.play(player);

    expect(activePlayer.hand.count).toBe(initialHandCount - 3);
    expect(activePlayer.discard.count).toBe(initialDiscardCount + 3);
    expect(activePlayer.discard.getCard(card1)).toBe(card1);
    expect(activePlayer.discard.getCard(card2)).toBe(card2);
    expect(activePlayer.discard.getCard(card3)).toBe(card3);
    expect(activePlayer.hand.getCard(card4)).toBe(card4);
  });

  it('Не сбрасывает карты если участник не выбрал', async () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.hand.addCardToTop(card);
    const initialHandCount = activePlayer.hand.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, []),
    });

    await stoneShard.play(player);

    expect(activePlayer.hand.count).toBe(initialHandCount);
  });
});
