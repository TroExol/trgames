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

import { ChaosC } from './ChaosC';

describe('ChaosC', () => {
  let card: ChaosC;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let thirdPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;

    // Создаем третьего участника для более интересных тестов
    thirdPlayer = new Player({ nickname: 'thirdPlayer', room, participant: 'player' });
    room.players.addPlayerToBottom(thirdPlayer);
    const thirdPlayerSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(thirdPlayer.nickname, thirdPlayerSocket);

    card = new ChaosC(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosC();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_C);
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
    const card = new ChaosC(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_C);
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
      strike: 'Все показывают верхнюю карту стопки. Самые дорогие карты идут в сброс к владельцам самых дешевых',
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
    it('Показывает верхние карты всех участников с подписями владельцев', async () => {
      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 3 });
      const card3 = new MockCard({ room, price: 1 });

      addCardToPlayerDeck(card1, activePlayer);
      addCardToPlayerDeck(card2, player);
      addCardToPlayerDeck(card3, thirdPlayer);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      vi.spyOn(room.socketService, 'showCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect((room.socketService.showCards as any).mock.calls[0][0].players.nicknames)
        .toEqual(room.playersAndViewers.nicknames);
      expect((room.socketService.showCards as any).mock.calls[0][0].cards.ids)
        .toEqual(new CardGroup(ECardGroupType.ANY, [card1, card2, card3]).ids);
      expect((room.socketService.showCards as any).mock.calls[0][0].cardsSubtitle).toEqual({
        [card1.readableId]: activePlayer.nickname,
        [card2.readableId]: player.nickname,
        [card3.readableId]: thirdPlayer.nickname,
      });
      expect((room.socketService.showCards as any).mock.calls[0][0].title).toEqual('Верхняя карта стопки участников');
    });

    it('Передает дорогие карты случайному владельцу дешевых карт', async () => {
      const cheapCard = new MockCard({ room, price: 1 }); // дешевая у activePlayer
      const expensiveCard = new MockCard({ room, price: 5 }); // дорогая у player
      const mediumCard = new MockCard({ room, price: 3 }); // средняя у thirdPlayer

      addCardToPlayerDeck(cheapCard, activePlayer);
      addCardToPlayerDeck(expensiveCard, player);
      addCardToPlayerDeck(mediumCard, thirdPlayer);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDeck = player.deck.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Дорогая карта должна перейти в сброс к владельцу дешевой карты (activePlayer)
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 1);
      expect(activePlayer.discard.top).toBe(expensiveCard);
      expect(player.deck.count).toBe(initialPlayerDeck - 1);
    });

    it('Не делает ничего если все карты одной цены', async () => {
      const card1 = new MockCard({ room, price: 3 });
      const card2 = new MockCard({ room, price: 3 });
      const card3 = new MockCard({ room, price: 3 });

      addCardToPlayerDeck(card1, activePlayer);
      addCardToPlayerDeck(card2, player);
      addCardToPlayerDeck(card3, thirdPlayer);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDiscard = player.discard.count;
      const initialThirdPlayerDiscard = thirdPlayer.discard.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Никто не должен получить карты в сброс
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard);
      expect(player.discard.count).toBe(initialPlayerDiscard);
      expect(thirdPlayer.discard.count).toBe(initialThirdPlayerDiscard);
    });

    it('Заполняет стопку если она пуста', async () => {
      // Очищаем стопки
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Добавляем карты в сброс
      const discardCard1 = new MockCard({ room });
      const discardCard2 = new MockCard({ room });
      const discardCard3 = new MockCard({ room });

      activePlayer.discard.addCardToTop(discardCard1);
      player.discard.addCardToTop(discardCard2);
      thirdPlayer.discard.addCardToTop(discardCard3);

      vi.spyOn(activePlayer, 'fillDeck');
      vi.spyOn(player, 'fillDeck');
      vi.spyOn(thirdPlayer, 'fillDeck');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.fillDeck).toHaveBeenCalled();
      expect(player.fillDeck).toHaveBeenCalled();
      expect(thirdPlayer.fillDeck).toHaveBeenCalled();
    });

    it('Ничего не делает если у всех участников пустые стопки', async () => {
      // Очищаем все стопки и сбросы
      activePlayer.deck.clear();
      activePlayer.discard.clear();
      player.deck.clear();
      player.discard.clear();
      thirdPlayer.deck.clear();
      thirdPlayer.discard.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      vi.spyOn(room.socketService, 'showCards');

      await card.play({ tempPlayer: activePlayer });

      expect(room.socketService.showCards).not.toHaveBeenCalled();
    });

    it('Участники могут укрыться от эффекта', async () => {
      const card1 = new MockCard({ room, price: 1 });
      const card2 = new MockCard({ room, price: 5 });
      const card3 = new MockCard({ room, price: 3 });

      addCardToPlayerDeck(card1, activePlayer);
      addCardToPlayerDeck(card2, player);
      addCardToPlayerDeck(card3, thirdPlayer);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      vi.spyOn(room.socketService, 'showCards');

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialThirdPlayerDiscard = thirdPlayer.discard.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Показываются только карты участников, которые не укрылись
      expect((room.socketService.showCards as any).mock.calls[0][0].players.nicknames)
        .toEqual(room.playersAndViewers.nicknames);
      expect((room.socketService.showCards as any).mock.calls[0][0].cards.ids)
        .toEqual(new CardGroup(ECardGroupType.ANY, [card2, card3]).ids);
      expect((room.socketService.showCards as any).mock.calls[0][0].cardsSubtitle).toEqual({
        [card2.readableId]: player.nickname,
        [card3.readableId]: thirdPlayer.nickname,
      });
      expect((room.socketService.showCards as any).mock.calls[0][0].title).toEqual('Верхняя карта стопки участников');

      // activePlayer укрылся, поэтому его карта не участвует в перераспределении
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard);
      // Самая дорогая карта (card2, цена 5) идет к владельцу самой дешевой (thirdPlayer, цена 3)
      expect(thirdPlayer.discard.count).toBe(initialThirdPlayerDiscard + 1);
      expect(thirdPlayer.discard.top).toBe(card2);
    });

    it('Работает корректно с несколькими дорогими картами', async () => {
      const cheapCard = new MockCard({ room, price: 1 });
      const expensiveCard1 = new MockCard({ room, price: 5 });
      const expensiveCard2 = new MockCard({ room, price: 5 });

      addCardToPlayerDeck(cheapCard, activePlayer);
      addCardToPlayerDeck(expensiveCard1, player);
      addCardToPlayerDeck(expensiveCard2, thirdPlayer);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const initialActivePlayerDiscard = activePlayer.discard.count;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Обе дорогие карты должны перейти к владельцу дешевой карты
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 2);
      expect(activePlayer.discard.array).toEqual(
        expect.arrayContaining([expensiveCard1, expensiveCard2]),
      );
    });
  });
});
