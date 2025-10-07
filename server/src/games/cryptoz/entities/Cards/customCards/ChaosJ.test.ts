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
  addCardToPlayerDeck,
  addCardToPlayerDiscard,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosJ } from './ChaosJ';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosJ', () => {
  let card: ChaosJ;
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

    card = new ChaosJ(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosJ();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_J);
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
    const card = new ChaosJ(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_J);
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
      general: 'Все могут взять верхнюю карту основной стопки. Взявшие уничтожают верхнюю карту своей стопки',
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
    it('Участники берут карты из основной стопки и уничтожают карты своей стопки', async () => {
      // Очищаем руки и стопки участников
      activePlayer.hand.clear();
      activePlayer.deck.clear();
      player.hand.clear();
      player.deck.clear();
      thirdPlayer.hand.clear();
      thirdPlayer.deck.clear();

      // Добавляем карты в основную стопку
      const mainDeckCard1 = new MockCard({ room });
      const mainDeckCard2 = new MockCard({ room });
      const mainDeckCard3 = new MockCard({ room });
      room.deck.addCardToTop(mainDeckCard1);
      room.deck.addCardToTop(mainDeckCard2);
      room.deck.addCardToTop(mainDeckCard3);

      // Добавляем карты в личные стопки участников
      const activePlayerDeckCard = new MockCard({ room });
      const playerDeckCard = new MockCard({ room });
      const thirdPlayerDeckCard = new MockCard({ room });
      addCardToPlayerDeck(activePlayerDeckCard, activePlayer);
      addCardToPlayerDeck(playerDeckCard, player);
      addCardToPlayerDeck(thirdPlayerDeckCard, thirdPlayer);

      // Мокаем выборы: все берут карты
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // activePlayer берет
        .mockResolvedValueOnce(1) // player берет
        .mockResolvedValueOnce(1); // thirdPlayer берет

      const initialMainDeckCount = room.deck.count; // 3
      const initialRemovedCount = room.removed.cards.count;
      const initialActivePlayerHandCount = activePlayer.hand.count; // 0
      const initialPlayerHandCount = player.hand.count; // 0
      const initialThirdPlayerHandCount = thirdPlayer.hand.count; // 0

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем результаты
      expect(room.deck.count).toBe(initialMainDeckCount - 3); // -3 взятые карты
      expect(room.removed.cards.count).toBe(initialRemovedCount + 3); // +3 уничтоженные карты

      // Все участники получили по карте в руку
      expect(activePlayer.hand.count).toBe(initialActivePlayerHandCount + 1);
      expect(player.hand.count).toBe(initialPlayerHandCount + 1);
      expect(thirdPlayer.hand.count).toBe(initialThirdPlayerHandCount + 1);

      // У всех участников уничтожена карта из личной стопки
      expect(activePlayer.deck.count).toBe(0); // была 1, уничтожили
      expect(player.deck.count).toBe(0); // была 1, уничтожили
      expect(thirdPlayer.deck.count).toBe(0); // была 1, уничтожили
    });

    it('Участники могут отказаться от взятия карт', async () => {
      activePlayer.hand.clear();
      activePlayer.deck.clear();
      player.hand.clear();
      player.deck.clear();
      thirdPlayer.hand.clear();
      thirdPlayer.deck.clear();

      // Добавляем карты в основную стопку
      const mainDeckCard1 = new MockCard({ room });
      const mainDeckCard2 = new MockCard({ room });
      room.deck.addCardToTop(mainDeckCard1);
      room.deck.addCardToTop(mainDeckCard2);

      // Добавляем карты в личные стопки
      const activePlayerDeckCard = new MockCard({ room });
      const playerDeckCard = new MockCard({ room });
      addCardToPlayerDeck(activePlayerDeckCard, activePlayer);
      addCardToPlayerDeck(playerDeckCard, player);

      // Мокаем выборы: activePlayer отказывается, player берет
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(2) // activePlayer отказывается
        .mockResolvedValueOnce(1); // player берет

      const initialMainDeckCount = room.deck.count; // 2
      const initialRemovedCount = room.removed.cards.count;
      const initialActivePlayerHandCount = activePlayer.hand.count;
      const initialPlayerHandCount = player.hand.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer: ничего не изменилось
      expect(activePlayer.hand.count).toBe(initialActivePlayerHandCount);
      expect(activePlayer.deck.count).toBe(1); // карта осталась в стопке

      // player: взял карту и уничтожил карту из стопки
      expect(player.hand.count).toBe(initialPlayerHandCount + 1);
      expect(player.deck.count).toBe(0); // карта уничтожена

      expect(room.deck.count).toBe(initialMainDeckCount - 1); // -1 взятая карта
      expect(room.removed.cards.count).toBe(initialRemovedCount + 1); // +1 уничтоженная карта
    });

    it('Работает когда у участника пустая личная стопка', async () => {
      // Очищаем личную стопку activePlayer, но добавляем карты в сброс
      activePlayer.deck.clear();
      const discardCard1 = new MockCard({ room });
      const discardCard2 = new MockCard({ room });
      addCardToPlayerDiscard(discardCard1, activePlayer);
      addCardToPlayerDiscard(discardCard2, activePlayer);

      // Добавляем карту в основную стопку
      const mainDeckCard = new MockCard({ room });
      room.deck.addCardToTop(mainDeckCard);

      // Мокаем выбор: activePlayer берет карту
      room.socketService.selectVariant = vi.fn().mockResolvedValueOnce(1);

      const initialMainDeckCount = room.deck.count; // 1
      const initialRemovedCount = room.removed.cards.count;
      const initialDiscardCount = activePlayer.discard.count; // 2

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer взял карту из основной стопки
      expect(activePlayer.hand.count).toBeGreaterThan(0);
      expect(room.deck.count).toBe(initialMainDeckCount - 1);

      // Сброс должен быть перемешан в стопку и одна карта уничтожена
      expect(activePlayer.discard.count).toBe(0); // перемешался в стопку
      expect(activePlayer.deck.count).toBe(initialDiscardCount - 1); // -1 уничтоженная карта
      expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
    });

    it('Ничего не происходит если основная стопка пуста', async () => {
      // Очищаем основную стопку
      room.deck.clear();

      // Добавляем карты в личные стопки
      const activePlayerDeckCard = new MockCard({ room });
      addCardToPlayerDeck(activePlayerDeckCard, activePlayer);

      const initialActivePlayerHandCount = activePlayer.hand.count;
      const initialActivePlayerDeckCount = activePlayer.deck.count;
      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Ничего не должно измениться
      expect(activePlayer.hand.count).toBe(initialActivePlayerHandCount);
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeckCount);
      expect(room.removed.cards.count).toBe(initialRemovedCount);
    });

    it('Участник не может уничтожить карту если у него нет карт в сбросе и стопке', async () => {
      // Очищаем все карты у activePlayer
      activePlayer.hand.clear();
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      // Добавляем карту в основную стопку
      const mainDeckCard = new MockCard({ room });
      room.deck.addCardToTop(mainDeckCard);

      // Мокаем выбор: activePlayer берет карту
      room.socketService.selectVariant = vi.fn().mockResolvedValueOnce(1);

      const initialMainDeckCount = room.deck.count; // 1
      const initialRemovedCount = room.removed.cards.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer взял карту из основной стопки
      expect(activePlayer.hand.count).toBe(1);
      expect(room.deck.count).toBe(initialMainDeckCount - 1);

      // Но не смог уничтожить карту (ее нет)
      expect(room.removed.cards.count).toBe(initialRemovedCount);
    });

    it('Работает с конкретными целями', async () => {
      activePlayer.hand.clear();
      activePlayer.deck.clear();
      player.hand.clear();
      player.deck.clear();
      thirdPlayer.hand.clear();
      thirdPlayer.deck.clear();

      // Добавляем карты в основную стопку
      const mainDeckCard1 = new MockCard({ room });
      const mainDeckCard2 = new MockCard({ room });
      room.deck.addCardToTop(mainDeckCard1);
      room.deck.addCardToTop(mainDeckCard2);

      // Добавляем карты в личные стопки
      const activePlayerDeckCard = new MockCard({ room });
      const thirdPlayerDeckCard = new MockCard({ room });
      addCardToPlayerDeck(activePlayerDeckCard, activePlayer);
      addCardToPlayerDeck(thirdPlayerDeckCard, thirdPlayer);

      // Мокаем выборы: оба берут карты
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // activePlayer берет
        .mockResolvedValueOnce(1); // thirdPlayer берет

      const initialMainDeckCount = room.deck.count; // 2
      const initialPlayerHandCount = player.hand.count;

      // Применяем эффект только к activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer и thirdPlayer взяли карты
      expect(activePlayer.hand.count).toBeGreaterThan(0);
      expect(thirdPlayer.hand.count).toBeGreaterThan(0);
      expect(activePlayer.deck.count).toBe(0); // карта уничтожена
      expect(thirdPlayer.deck.count).toBe(0); // карта уничтожена

      // player не участвовал
      expect(player.hand.count).toBe(initialPlayerHandCount);

      expect(room.deck.count).toBe(initialMainDeckCount - 2); // -2 взятые карты
    });
  });
});
