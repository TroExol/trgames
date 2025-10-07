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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { ChaosF } from './ChaosF';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosF', () => {
  let card: ChaosF;
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

    card = new ChaosF(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosF();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_F);
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
    const card = new ChaosF(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_F);
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
      strike: 'Все показывают 2 верхние карты стопки. Одну из них уничтожают, другую берут и получают урон равный стоимости взятой карты',
    });
  });

  it('canPlayGeneralHandler возвращает false', () => {
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('canPlayStrikeHandler возвращает true', () => {
    expect(card.canPlayStrikeHandler()).toBeTruthy();
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
    it('Участник показывает 2 карты, выбирает одну для получения, другая уничтожается', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const card1 = new MockCard({ room, price: 3 });
      const card2 = new MockCard({ room, price: 5 });
      const card3 = new MockCard({ room, price: 1 }); // третья карта в стопке

      addCardToPlayerDeck(card3, activePlayer);
      addCardToPlayerDeck(card2, activePlayer);
      addCardToPlayerDeck(card1, activePlayer);

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;
      const initialDeckCount = activePlayer.deck.count;
      const initialRemovedCount = room.removed.cards.count;

      // Мокаем показ карт
      vi.spyOn(room.socketService, 'showCards');

      // Участник выбирает первую карту (card1) для получения
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [card1]),
      });

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем результат
      expect(activePlayer.hand.count).toBe(initialHandCount + 1); // +1 взятая карта
      expect(activePlayer.hand.array).toContain(card1); // card1 в руке
      expect(activePlayer.deck.count).toBe(initialDeckCount - 2); // -2 карты из стопки
      expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
      expect(room.removed.cards.array).toEqual([card2]);
      expect(activePlayer.health).toBe(initialHealth - 3); // -3 урона (цена card1)
      expect(activePlayer.playedCards.count).toBe(0);
    });

    it('Участник может укрыться от эффекта', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 4 });

      addCardToPlayerDeck(card2, activePlayer);
      addCardToPlayerDeck(card1, activePlayer);

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      vi.spyOn(room.socketService, 'showCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer укрылся - никаких изменений
      expect(activePlayer.health).toBe(initialHealth);
      expect(activePlayer.hand.count).toBe(initialHandCount);
      expect(room.socketService.showCards).not.toHaveBeenCalledWith(
        expect.objectContaining({
          title: `Верхние карты стопки участника ${activePlayer.nickname}`,
        }),
      );
    });

    it('Заполняет стопку если карт меньше 2', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Очищаем стопку
      activePlayer.deck.clear();

      // Добавляем карты в сброс
      const discardCard1 = new MockCard({ room, price: 2 });
      const discardCard2 = new MockCard({ room, price: 3 });
      activePlayer.discard.addCardToTop(discardCard2);
      activePlayer.discard.addCardToTop(discardCard1);

      vi.spyOn(activePlayer, 'fillDeck');
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [discardCard2]),
      });

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.fillDeck).toHaveBeenCalled();
    });

    it('Пропускает участника если в стопке меньше 2 карт после fillDeck', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Очищаем стопку и сброс
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      vi.spyOn(room.socketService, 'showCards');

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      // Никаких изменений не должно быть
      expect(activePlayer.health).toBe(initialHealth);
      expect(activePlayer.hand.count).toBe(initialHandCount);
      expect(room.socketService.showCards).not.toHaveBeenCalled();
    });

    it('Не наносит урон если выбранная карта стоит 0', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const freeCard = new MockCard({ room, price: 0 });
      const expensiveCard = new MockCard({ room, price: 5 });

      addCardToPlayerDeck(freeCard, activePlayer);
      addCardToPlayerDeck(expensiveCard, activePlayer);

      const initialHealth = activePlayer.health;

      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [freeCard]),
      });

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Урон не должен быть нанесен
      expect(activePlayer.health).toBe(initialHealth);
      expect(activePlayer.hand.array).toContain(freeCard);
      expect(room.removed.cards.array).toContain(expensiveCard);
    });

    it('Обрабатывает нескольких участников независимо', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      // Карты для activePlayer
      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 3 });
      addCardToPlayerDeck(card1, activePlayer);
      addCardToPlayerDeck(card2, activePlayer);

      // Карты для player
      const card3 = new MockCard({ room, price: 1 });
      const card4 = new MockCard({ room, price: 4 });
      addCardToPlayerDeck(card3, player);
      addCardToPlayerDeck(card4, player);

      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      // Участники выбирают разные карты
      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [card1]), // activePlayer выбирает card1
        })
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [card4]), // player выбирает card4
        });

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем результаты для обоих участников
      expect(activePlayer.health).toBe(initialActivePlayerHealth - 2); // урон от card1
      expect(player.health).toBe(initialPlayerHealth - 4); // урон от card4

      expect(activePlayer.hand.array).toContain(card1);
      expect(player.hand.array).toContain(card4);

      expect(room.removed.cards.array).toEqual(
        expect.arrayContaining([card2, card3]),
      );
    });
  });
});
