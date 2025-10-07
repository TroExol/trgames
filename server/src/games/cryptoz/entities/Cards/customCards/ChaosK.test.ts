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

import { ChaosK } from './ChaosK';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosK', () => {
  let card: ChaosK;
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

    card = new ChaosK(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosK();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_K);
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
    const card = new ChaosK(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_K);
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
      general: 'Все могут уничтожить самую дорогую карту из руки и восстановить 13 здоровья',
    });
  });

  it('canPlayGeneralHandler возвращает true', () => {
    expect(card.canPlayGeneralHandler()).toBeTruthy();
  });

  it('canPlayStrikeHandler возвращает false', () => {
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
    it('Участники уничтожают самую дорогую карту и восстанавливают здоровье', async () => {
      // Очищаем руки и добавляем карты с разной стоимостью
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      const activePlayerCard1 = new MockCard({ room, price: 3 });
      const activePlayerCard2 = new MockCard({ room, price: 7 }); // самая дорогая
      const activePlayerCard3 = new MockCard({ room, price: 1 });

      const playerCard1 = new MockCard({ room, price: 5 }); // единственная, значит самая дорогая

      const thirdPlayerCard1 = new MockCard({ room, price: 2 });
      const thirdPlayerCard2 = new MockCard({ room, price: 8 }); // самая дорогая
      const thirdPlayerCard3 = new MockCard({ room, price: 4 });

      addCardToPlayerHand(activePlayerCard1, activePlayer);
      addCardToPlayerHand(activePlayerCard2, activePlayer);
      addCardToPlayerHand(activePlayerCard3, activePlayer);
      addCardToPlayerHand(playerCard1, player);
      addCardToPlayerHand(thirdPlayerCard1, thirdPlayer);
      addCardToPlayerHand(thirdPlayerCard2, thirdPlayer);
      addCardToPlayerHand(thirdPlayerCard3, thirdPlayer);

      // Устанавливаем здоровье участников
      activePlayer.health = 10;
      player.health = 5;
      thirdPlayer.health = 15;

      // Мокаем выборы: все соглашаются
      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 1 });

      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем результаты
      // У activePlayer должна остаться рука без самой дорогой карты (7)
      expect(activePlayer.hand.count).toBe(2); // было 3, удалили 1
      expect(activePlayer.hand.array).not.toContain(activePlayerCard2);
      expect(activePlayer.hand.array).toContain(activePlayerCard1);
      expect(activePlayer.hand.array).toContain(activePlayerCard3);
      expect(activePlayer.health).toBe(23); // 10 + 13

      // У player должна остаться пустая рука
      expect(player.hand.count).toBe(0); // было 1, удалили 1
      expect(player.health).toBe(18); // 5 + 13

      // У thirdPlayer должна остаться рука без самой дорогой карты (8)
      expect(thirdPlayer.hand.count).toBe(2); // было 3, удалили 1
      expect(thirdPlayer.hand.array).not.toContain(thirdPlayerCard2);
      expect(thirdPlayer.hand.array).toContain(thirdPlayerCard1);
      expect(thirdPlayer.hand.array).toContain(thirdPlayerCard3);
      expect(thirdPlayer.health).toBe(25); // 15 + 13, но максимум 25

      // Все карты уничтожены
      expect(room.removed.cards.count).toBe(initialRemovedCount + 3);
    });

    it('Участники могут отказаться от уничтожения карт', async () => {
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      const activePlayerCard = new MockCard({ room, price: 5 });
      const playerCard = new MockCard({ room, price: 3 });
      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);

      activePlayer.health = 10;
      player.health = 15;

      // Мокаем выборы: activePlayer отказывается, player соглашается
      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({ variant: 2 }) // activePlayer отказывается
        .mockResolvedValueOnce({ variant: 1 }); // player соглашается

      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer: ничего не изменилось
      expect(activePlayer.hand.count).toBe(1);
      expect(activePlayer.hand.array).toContain(activePlayerCard);
      expect(activePlayer.health).toBe(10); // без изменений

      // player: уничтожил карту и восстановил здоровье
      expect(player.hand.count).toBe(0);
      expect(player.health).toBe(25); // 15 + 13, но максимум 25

      expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
    });

    it('Ничего не происходит если у участника нет карт в руке', async () => {
      // Очищаем руки всех участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.health = 10;
      player.health = 15;
      thirdPlayer.health = 20;

      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Ничего не должно измениться
      expect(activePlayer.hand.count).toBe(0);
      expect(player.hand.count).toBe(0);
      expect(thirdPlayer.hand.count).toBe(0);
      expect(activePlayer.health).toBe(10);
      expect(player.health).toBe(15);
      expect(thirdPlayer.health).toBe(20);
      expect(room.removed.cards.count).toBe(initialRemovedCount);
    });

    it('Выбирает правильную самую дорогую карту среди нескольких с одинаковой ценой', async () => {
      activePlayer.hand.clear();

      // Добавляем карты с одинаковой максимальной ценой
      const card1 = new MockCard({ room, price: 5 });
      const card2 = new MockCard({ room, price: 8 }); // максимальная
      const card3 = new MockCard({ room, price: 8 }); // тоже максимальная
      const card4 = new MockCard({ room, price: 3 });

      addCardToPlayerHand(card1, activePlayer);
      addCardToPlayerHand(card2, activePlayer);
      addCardToPlayerHand(card3, activePlayer);
      addCardToPlayerHand(card4, activePlayer);

      activePlayer.health = 10;

      // Мокаем выбор: соглашается
      room.socketService.selectCards = vi.fn().mockResolvedValueOnce({ variant: 1 });

      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Должна быть удалена одна из карт с ценой 8
      expect(activePlayer.hand.count).toBe(3); // было 4, удалили 1
      expect(activePlayer.health).toBe(23); // 10 + 13
      expect(room.removed.cards.count).toBe(initialRemovedCount + 1);

      // Проверяем что удалена именно карта с ценой 8
      const removedCard = room.removed.cards.top;
      expect(removedCard?.basePrice).toBe(8);
    });

    it('Здоровье не превышает максимум', async () => {
      activePlayer.hand.clear();

      const expensiveCard = new MockCard({ room, price: 10 });
      addCardToPlayerHand(expensiveCard, activePlayer);

      // Устанавливаем здоровье близко к максимуму
      activePlayer.health = 20; // максимум 25

      room.socketService.selectCards = vi.fn().mockResolvedValueOnce({ variant: 1 });

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Здоровье должно быть ограничено максимумом
      expect(activePlayer.health).toBe(25); // 20 + 13 = 33, но максимум 25
      expect(activePlayer.hand.count).toBe(0);
    });

    it('Работает с конкретными целями', async () => {
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      const activePlayerCard = new MockCard({ room, price: 6 });
      const playerCard = new MockCard({ room, price: 4 });
      const thirdPlayerCard = new MockCard({ room, price: 8 });

      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);
      addCardToPlayerHand(thirdPlayerCard, thirdPlayer);

      activePlayer.health = 10;
      player.health = 15;
      thirdPlayer.health = 5;

      // Мокаем выборы: оба соглашаются
      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({ variant: 1 }) // activePlayer соглашается
        .mockResolvedValueOnce({ variant: 1 }); // thirdPlayer соглашается

      const initialRemovedCount = room.removed.cards.count;

      // Применяем эффект только к activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer и thirdPlayer участвовали
      expect(activePlayer.hand.count).toBe(0);
      expect(activePlayer.health).toBe(23); // 10 + 13
      expect(thirdPlayer.hand.count).toBe(0);
      expect(thirdPlayer.health).toBe(18); // 5 + 13

      // player не участвовал
      expect(player.hand.count).toBe(1);
      expect(player.hand.array).toContain(playerCard);
      expect(player.health).toBe(15); // без изменений

      expect(room.removed.cards.count).toBe(initialRemovedCount + 2);
    });
  });
});
