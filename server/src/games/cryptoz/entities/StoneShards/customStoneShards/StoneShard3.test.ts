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

import { StoneShard3 } from './StoneShard3';

describe('StoneShard3', () => {
  let stoneShard: StoneShard3;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard3(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard3();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(3);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard3(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(3);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Уничтожь карту из сброса');
  });

  it('Нельзя разыграть если сброс пустой', () => {
    activePlayer.discard.clear();
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если в сбросе есть карты', () => {
    activePlayer.discard.addCardToTop(new MockCard({ room, name: 'Тестовая карта' }));
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и уничтожает карту из сброса', async () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.discard.addCardToTop(card);
    const initialDiscardCount = activePlayer.discard.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({ cards: new CardGroup(ECardGroupType.ANY, [card]) });

    await stoneShard.play(player);

    expect(activePlayer.discard.getCard(card)).toBeNull();
    expect(room.removed.cards.count).toBe(1);
    expect(room.removed.cards.getCard(card)).toBe(card);
    expect(activePlayer.discard.count).toBe(initialDiscardCount - 1);
  });
});
