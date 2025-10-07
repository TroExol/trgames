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

import { StoneShard5 } from './StoneShard5';

describe('StoneShard5', () => {
  let stoneShard: StoneShard5;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard5(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard5();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(5);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard5(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(5);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Покажи карту с верха стопки, передай ее другому');
  });

  it('Нельзя разыграть если стопка пустая', () => {
    activePlayer.deck.clear();
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Нельзя разыграть если только один участник', () => {
    room.players.removePlayer(player);
    expect(stoneShard.canPlayHandler()).toBeFalsy();
  });

  it('Можно разыграть если есть карты в стопке и другие участники', () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.deck.addCardToTop(card);
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается и передает карту другому участнику', async () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.deck.addCardToTop(card);
    const initialDeckCount = activePlayer.deck.count;
    const initialPlayerDiscardCount = player.discard.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: player.nickname });

    await stoneShard.play(player);

    expect(activePlayer.deck.count).toBe(initialDeckCount - 1);
    expect(activePlayer.deck.getCard(card)).toBeNull();
    expect(player.discard.count).toBe(initialPlayerDiscardCount + 1);
    expect(player.discard.getCard(card)).toBe(card);
    expect(card.ownerNickname).toBe(player.nickname);
  });

  it('Не передает карту если участник не выбрал цель', async () => {
    const card = new MockCard({ room, name: 'Тестовая карта' });
    activePlayer.deck.addCardToTop(card);
    const initialDeckCount = activePlayer.deck.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: undefined });

    await stoneShard.play(player);

    expect(activePlayer.deck.count).toBe(initialDeckCount);
    expect(activePlayer.deck.getCard(card)).toBe(card);
  });
});
