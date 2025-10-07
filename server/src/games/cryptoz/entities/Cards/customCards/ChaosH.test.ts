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
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosH } from './ChaosH';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosH', () => {
  let card: ChaosH;
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

    card = new ChaosH(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosH();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_H);
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
    const card = new ChaosH(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_H);
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
      general: 'Все сбрасывают руку, перекладывают стопку в сброс, перемешивают сброс и берут 5 карт',
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
    it('Все участники сбрасывают руку и стопку, перемешивают сброс и берут 5 карт', async () => {
      activePlayer.discard.clear();
      activePlayer.deck.clear();
      activePlayer.hand.clear();
      player.discard.clear();
      player.deck.clear();
      player.hand.clear();
      thirdPlayer.discard.clear();
      thirdPlayer.deck.clear();

      // Подготавливаем карты для activePlayer
      const handCard1 = new MockCard({ room });
      const handCard2 = new MockCard({ room });
      const deckCard1 = new MockCard({ room });
      const deckCard2 = new MockCard({ room });
      const discardCard1 = new MockCard({ room });

      addCardToPlayerHand(handCard1, activePlayer);
      addCardToPlayerHand(handCard2, activePlayer);
      addCardToPlayerDeck(deckCard1, activePlayer);
      addCardToPlayerDeck(deckCard2, activePlayer);
      addCardToPlayerDiscard(discardCard1, activePlayer);

      // Подготавливаем карты для player
      const playerHandCard = new MockCard({ room });
      const playerDeckCard = new MockCard({ room });
      const playerDiscardCard = new MockCard({ room });
      const playerDiscardCard2 = new MockCard({ room });
      const playerDiscardCard3 = new MockCard({ room });

      addCardToPlayerHand(playerHandCard, player);
      addCardToPlayerDeck(playerDeckCard, player);
      addCardToPlayerDiscard(playerDiscardCard, player);
      addCardToPlayerDiscard(playerDiscardCard2, player);
      addCardToPlayerDiscard(playerDiscardCard3, player);

      // Запоминаем начальные состояния
      const initialActivePlayerHandCount = activePlayer.hand.count; // 2
      const initialActivePlayerDeckCount = activePlayer.deck.count; // 2
      const initialActivePlayerDiscardCount = activePlayer.discard.count; // 1

      const initialPlayerHandCount = player.hand.count; // 1
      const initialPlayerDeckCount = player.deck.count; // 1
      const initialPlayerDiscardCount = player.discard.count; // 1

      // Шпионим за методами
      vi.spyOn(activePlayer, 'discardHand');
      vi.spyOn(activePlayer, 'takeCards');
      vi.spyOn(player, 'discardHand');
      vi.spyOn(player, 'takeCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем вызовы методов для activePlayer
      expect(activePlayer.discardHand).toHaveBeenCalled();
      expect(activePlayer.takeCards).toHaveBeenCalledWith(5);

      // Проверяем вызовы методов для player
      expect(player.discardHand).toHaveBeenCalled();
      expect(player.takeCards).toHaveBeenCalledWith(5);

      // Проверяем итоговые состояния activePlayer
      expect(activePlayer.hand.count).toBe(5); // Взял 5 карт
      const totalActivePlayerCards = initialActivePlayerHandCount
        + initialActivePlayerDeckCount
        + initialActivePlayerDiscardCount;
      expect(activePlayer.deck.count).toBeLessThan(totalActivePlayerCards); // Часть карт в руке

      // Проверяем итоговые состояния player
      expect(player.hand.count).toBe(5); // Взял 5 карт
      const totalPlayerCards = initialPlayerHandCount + initialPlayerDeckCount + initialPlayerDiscardCount;
      expect(player.deck.count).toBeLessThan(totalPlayerCards); // Часть карт в руке
    });

    it('Работает с пустой рукой', async () => {
      // Очищаем руки
      activePlayer.hand.clear();
      player.hand.clear();

      // Добавляем только карты в стопку и сброс
      const deckCard = new MockCard({ room });
      const discardCard = new MockCard({ room });
      addCardToPlayerDeck(deckCard, activePlayer);
      addCardToPlayerDiscard(discardCard, activePlayer);

      vi.spyOn(activePlayer, 'discardHand');
      vi.spyOn(activePlayer, 'takeCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // discardHand должен быть вызван, но с пустой рукой
      expect(activePlayer.discardHand).toHaveBeenCalled();
      expect(activePlayer.takeCards).toHaveBeenCalledWith(5);

      // Проверяем что взял карты (сколько смог)
      expect(activePlayer.hand.count).toBeGreaterThan(0);
    });

    it('Работает с пустой стопкой', async () => {
      // Очищаем стопку
      activePlayer.deck.clear();

      // Добавляем карты только в руку и сброс
      const handCard = new MockCard({ room });
      const discardCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);
      addCardToPlayerDiscard(discardCard, activePlayer);

      vi.spyOn(activePlayer, 'discardHand');
      vi.spyOn(activePlayer, 'takeCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.discardHand).toHaveBeenCalled();
      expect(activePlayer.takeCards).toHaveBeenCalledWith(5);

      expect(activePlayer.hand.count).toBeGreaterThan(0);
    });

    it('Работает с участником без карт', async () => {
      // Очищаем все карты у участника
      activePlayer.hand.clear();
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      vi.spyOn(activePlayer, 'discardHand');
      vi.spyOn(activePlayer, 'takeCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Методы должны быть вызваны, но эффекта не будет
      expect(activePlayer.discardHand).toHaveBeenCalled();
      expect(activePlayer.takeCards).toHaveBeenCalledWith(5);

      expect(activePlayer.hand.count).toBe(0); // Нет карт для взятия
    });

    it('Работает с конкретными участниками', async () => {
      // Добавляем карты только activePlayer и thirdPlayer
      const card1 = new MockCard({ room });
      const card2 = new MockCard({ room });
      addCardToPlayerHand(card1, activePlayer);
      addCardToPlayerHand(card2, thirdPlayer);

      vi.spyOn(activePlayer, 'discardHand');
      vi.spyOn(player, 'discardHand');
      vi.spyOn(thirdPlayer, 'discardHand');

      // Применяем эффект только к activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer и thirdPlayer должны быть затронуты
      expect(activePlayer.discardHand).toHaveBeenCalled();
      expect(thirdPlayer.discardHand).toHaveBeenCalled();

      // player НЕ должен быть затронут
      expect(player.discardHand).not.toHaveBeenCalled();
    });

    it('Все участники получают по 5 карт в руку', async () => {
      // Добавляем достаточно карт каждому участнику для взятия 5
      for (let i = 0; i < 8; i++) {
        addCardToPlayerDiscard(new MockCard({ room }), activePlayer);
        addCardToPlayerDiscard(new MockCard({ room }), player);
        addCardToPlayerDiscard(new MockCard({ room }), thirdPlayer);
      }

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Все участники должны иметь по 5 карт в руке
      expect(activePlayer.hand.count).toBe(5);
      expect(player.hand.count).toBe(5);
      expect(thirdPlayer.hand.count).toBe(5);
    });
  });
});
