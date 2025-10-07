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

import { ChaosI } from './ChaosI';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosI', () => {
  let card: ChaosI;
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

    card = new ChaosI(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosI();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_I);
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
    const card = new ChaosI(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_I);
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
      strike: 'Все уничтожают случайную карту из руки и получают Безумие тьмы в руку',
    });
  });

  it('canPlayStrikeHandler возвращает true', () => {
    expect(card.canPlayStrikeHandler()).toBeTruthy();
  });

  it('canPlayGeneralHandler возвращает false', () => {
    expect(card.canPlayGeneralHandler()).toBeFalsy();
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
    it('Все участники уничтожают случайную карту из руки и получают Безумие тьмы', async () => {
      // Очищаем руки и добавляем карты
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      const activePlayerCard1 = new MockCard({ room });
      const activePlayerCard2 = new MockCard({ room });
      const playerCard = new MockCard({ room });
      const thirdPlayerCard = new MockCard({ room });

      addCardToPlayerHand(activePlayerCard1, activePlayer);
      addCardToPlayerHand(activePlayerCard2, activePlayer);
      addCardToPlayerHand(playerCard, player);
      addCardToPlayerHand(thirdPlayerCard, thirdPlayer);

      // Добавляем Безумие тьмы в комнату
      room.darknessMadness.clear();
      const darknessMadness1 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      const darknessMadness2 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      const darknessMadness3 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      room.darknessMadness.addCardToTop(darknessMadness1);
      room.darknessMadness.addCardToTop(darknessMadness2);
      room.darknessMadness.addCardToTop(darknessMadness3);

      const initialHandCounts = {
        activePlayer: activePlayer.hand.count, // 2
        player: player.hand.count, // 1
        thirdPlayer: thirdPlayer.hand.count, // 1
      };

      const initialDarknessMadnessCount = room.darknessMadness.count; // 3
      const initialRemovedCount = room.removed.cards.count;

      vi.spyOn(activePlayer, 'removeCards');
      vi.spyOn(activePlayer, 'takeCardsToHand');
      vi.spyOn(player, 'removeCards');
      vi.spyOn(player, 'takeCardsToHand');
      vi.spyOn(thirdPlayer, 'removeCards');
      vi.spyOn(thirdPlayer, 'takeCardsToHand');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем итоговые состояния
      expect(activePlayer.hand.count).toBe(initialHandCounts.activePlayer); // 2-1+1=2
      expect(player.hand.count).toBe(initialHandCounts.player); // 1-1+1=1
      expect(thirdPlayer.hand.count).toBe(initialHandCounts.thirdPlayer); // 1-1+1=1

      expect(room.removed.cards.count).toBe(initialRemovedCount + 3); // +3 уничтоженные карты
      expect(room.darknessMadness.count).toBe(initialDarknessMadnessCount - 3); // 3-3=0
    });

    it('Работает с участниками без карт в руке', async () => {
      // Очищаем руки
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Добавляем Безумие тьмы
      const darknessMadness1 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      const darknessMadness2 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      const darknessMadness3 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      room.darknessMadness.addCardToTop(darknessMadness1);
      room.darknessMadness.addCardToTop(darknessMadness2);
      room.darknessMadness.addCardToTop(darknessMadness3);

      const initialDarknessMadnessCount = room.darknessMadness.count;
      const initialRemovedCount = room.removed.cards.count;

      vi.spyOn(activePlayer, 'removeCards');
      vi.spyOn(activePlayer, 'takeCardsToHand');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Все участники получили по карте Безумия тьмы
      expect(activePlayer.hand.count).toBe(1);
      expect(player.hand.count).toBe(1);
      expect(thirdPlayer.hand.count).toBe(1);

      expect(room.darknessMadness.count).toBe(initialDarknessMadnessCount - 3);
      expect(room.removed.cards.count).toBe(initialRemovedCount); // Карты не уничтожались
    });

    it('Работает без Безумия тьмы в комнате', async () => {
      // Очищаем Безумие тьмы
      room.darknessMadness.clear();
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Добавляем карты в руки
      const activePlayerCard = new MockCard({ room });
      const playerCard = new MockCard({ room });
      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);

      const initialRemovedCount = room.removed.cards.count;

      vi.spyOn(activePlayer, 'removeCards');
      vi.spyOn(activePlayer, 'takeCardsToHand');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Руки уменьшились на 1 карту
      expect(activePlayer.hand.count).toBe(0);
      expect(player.hand.count).toBe(0);

      expect(room.removed.cards.count).toBe(initialRemovedCount + 2); // +2 уничтоженные карты
    });

    it('Участники могут укрываться от эффекта', async () => {
      // Добавляем карты в руки
      const activePlayerCard = new MockCard({ room });
      const playerCard = new MockCard({ room });
      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);

      // Добавляем Безумие тьмы
      const darknessMadness = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      room.darknessMadness.addCardToTop(darknessMadness);

      // Мокаем укрытие: activePlayer укрывается, player нет
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(activePlayer, 'removeCards');
      vi.spyOn(activePlayer, 'takeCardsToHand');
      vi.spyOn(player, 'removeCards');
      vi.spyOn(player, 'takeCardsToHand');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer укрылся - эффект не применился
      expect(activePlayer.tryEvade).toHaveBeenCalled();
      expect(activePlayer.removeCards).not.toHaveBeenCalled();
      expect(activePlayer.takeCardsToHand).not.toHaveBeenCalled();

      // player не укрылся - эффект применился
      expect(player.tryEvade).toHaveBeenCalled();
      expect(player.removeCards).toHaveBeenCalled();
      expect(player.takeCardsToHand).toHaveBeenCalled();
    });

    it('Работает с конкретными целями', async () => {
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      thirdPlayer.tryEvade = vi.fn().mockResolvedValue(false);

      // Добавляем карты всем участникам
      const activePlayerCard = new MockCard({ room });
      const playerCard = new MockCard({ room });
      const thirdPlayerCard = new MockCard({ room });
      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);
      addCardToPlayerHand(thirdPlayerCard, thirdPlayer);

      // Добавляем Безумие тьмы
      const darknessMadness1 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      const darknessMadness2 = new MockCard({ room, type: CryptozShared.ECardType.DARKNESS_MADNESS });
      room.darknessMadness.addCardToTop(darknessMadness1);
      room.darknessMadness.addCardToTop(darknessMadness2);

      vi.spyOn(activePlayer, 'removeCards');
      vi.spyOn(player, 'removeCards');
      vi.spyOn(thirdPlayer, 'removeCards');

      // Применяем эффект только к activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем состояния рук
      expect(activePlayer.hand.count).toBe(1); // 1-1+1=1
      expect(player.hand.count).toBe(1); // без изменений
      expect(thirdPlayer.hand.count).toBe(1); // 1-1+1=1
    });
  });
});
