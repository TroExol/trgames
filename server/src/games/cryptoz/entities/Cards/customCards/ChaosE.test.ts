import type { Socket } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosE } from './ChaosE';

describe('ChaosE', () => {
  let card: ChaosE;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let thirdPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;

    // Создаем третьего участника
    thirdPlayer = new Player({ nickname: 'thirdPlayer', room, participant: 'player' });
    room.players.addPlayerToBottom(thirdPlayer);
    const thirdPlayerSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(thirdPlayer.nickname, thirdPlayerSocket);

    card = new ChaosE(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosE();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_E);
    expect(card.name).toBe('Хаос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CHAOS);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ChaosE(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_E);
    expect(card.name).toBe('Хаос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CHAOS);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      strike: 'Все подсчитывают стоимость карт в руке. Участники с наибольшей суммой получают 2 Проклятые печати',
    });
  });

  it('canPlayGeneralHandler возвращает false', () => {
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('canPlayStrikeHandler возвращает true если есть проклятые печати', () => {
    expect(room.cursedSeals.count).toBeGreaterThan(0);
    expect(card.canPlayStrikeHandler()).toBeTruthy();
  });

  it('canPlayStrikeHandler возвращает false если проклятых печатей нет', () => {
    room.cursedSeals.clear();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('canPlaySealHandler возвращает false', () => {
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('canPlayTotalDarknessStrikeHandler возвращает false', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('canPlayEvadeHandler возвращает false', () => {
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Хаос эффект', () => {
    it('Участник с наибольшей стоимостью карт получает 2 проклятые печати', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // activePlayer: карты стоимостью 2 + 3 = 5
      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 3 });
      addCardToPlayerHand(card1, activePlayer);
      addCardToPlayerHand(card2, activePlayer);

      // player: карта стоимостью 1
      const card3 = new MockCard({ room, price: 1 });
      addCardToPlayerHand(card3, player);

      // thirdPlayer: карты стоимостью 2 + 1 = 3
      const card4 = new MockCard({ room, price: 2 });
      const card5 = new MockCard({ room, price: 1 });
      addCardToPlayerHand(card4, thirdPlayer);
      addCardToPlayerHand(card5, thirdPlayer);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialCursedSeals = room.cursedSeals.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer имеет максимальную стоимость (5), должен получить 2 проклятые печати
      expect(room.cursedSeals.count).toBe(initialCursedSeals - 2);
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 2);

      // Остальные участники не должны получить печати
      expect(player.discard.count).toBe(0);
      expect(thirdPlayer.discard.count).toBe(0);
    });

    it('Несколько участников с одинаковой максимальной стоимостью получают печати', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // activePlayer: карты стоимостью 2 + 3 = 5
      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 3 });
      addCardToPlayerHand(card1, activePlayer);
      addCardToPlayerHand(card2, activePlayer);

      // player: карты стоимостью 4 + 1 = 5 (тоже максимальная)
      const card3 = new MockCard({ room, price: 4 });
      const card4 = new MockCard({ room, price: 1 });
      addCardToPlayerHand(card3, player);
      addCardToPlayerHand(card4, player);

      // thirdPlayer: карта стоимостью 2
      const card5 = new MockCard({ room, price: 2 });
      addCardToPlayerHand(card5, thirdPlayer);

      const initialCursedSeals = room.cursedSeals.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Два участника с максимальной стоимостью (5) должны получить по 2 печати
      expect(activePlayer.discard.count).toBe(2);
      expect(player.discard.count).toBe(2);
      expect(thirdPlayer.discard.count).toBe(0);
      expect(room.cursedSeals.count).toBe(initialCursedSeals - 4);
    });

    it('Участники могут укрыться от эффекта', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // activePlayer: карты стоимостью 5 (максимальная)
      const card1 = new MockCard({ room, price: 5 });
      addCardToPlayerHand(card1, activePlayer);

      // player: карты стоимостью 3
      const card2 = new MockCard({ room, price: 3 });
      addCardToPlayerHand(card2, player);

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer укрылся, поэтому player становится единственным с максимальной стоимостью
      expect(activePlayer.discard.count).toBe(0);
      expect(player.discard.count).toBe(2);
    });

    it('Работает с участниками без карт в руке', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // activePlayer: без карт (стоимость 0)
      activePlayer.discardHand(activePlayer.hand);

      // player: карта стоимостью 3 (максимальная)
      const card1 = new MockCard({ room, price: 3 });
      addCardToPlayerHand(card1, player);

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // player имеет максимальную стоимость
      expect(activePlayer.discard.count).toBe(5);
      expect(player.discard.count).toBe(2);
    });

    it('Никто не получает печати если все участники укрылись', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(true);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(true);

      await card.play({ tempPlayer: activePlayer });

      expect(activePlayer.discard.count).toBe(0);
      expect(player.discard.count).toBe(0);
      expect(thirdPlayer.discard.count).toBe(0);
    });
  });
});
