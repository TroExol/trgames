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

import { StoneShard7 } from './StoneShard7';

describe('StoneShard7', () => {
  let stoneShard: StoneShard7;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard7(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard7();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(7);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard7(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(7);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Противники могут положить карту из сброса в твой сброс');
  });

  it('Нельзя разыграть если только один участник', () => {
    room.players.removePlayer(player);
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если есть другие участники', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и враги могут передать карты', async () => {
    const card1 = new MockCard({ room, name: 'Тестовая карта 1' });
    const card2 = new MockCard({ room, name: 'Тестовая карта 2' });

    player.discard.addCardToTop(card1);
    player.discard.addCardToTop(card2);

    const initialPlayerDiscardCount = player.discard.count;
    const initialActivePlayerDiscardCount = activePlayer.discard.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [card1]),
    });

    await stoneShard.play(player);

    expect(player.discard.count).toBe(initialPlayerDiscardCount - 1);
    expect(activePlayer.discard.count).toBe(initialActivePlayerDiscardCount + 1);
    expect(activePlayer.discard.getCard(card1)).toBe(card1);
    expect(card1.ownerNickname).toBe(activePlayer.nickname);
  });

  it('Пропускает врагов с пустым сбросом', async () => {
    player.discard.clear();

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, []),
    });

    await stoneShard.play(player);

    expect(room.socketService.selectCards).not.toHaveBeenCalled();
  });
});
