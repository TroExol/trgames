import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerDeck,
  addCardToPlayerHand,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { StygianDemonWarlock } from './StygianDemonWarlock';

describe('StygianDemonWarlock', () => {
  let card: StygianDemonWarlock;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new StygianDemonWarlock(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new StygianDemonWarlock();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.STYGIAN_DEMON_WARLOCK);
    expect(card.name).toBe('Стигийский демон-колдун');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const mocks = createMockRoomWithPlayers();
    const card = new StygianDemonWarlock(mocks.room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.STYGIAN_DEMON_WARLOCK);
    expect(card.name).toBe('Стигийский демон-колдун');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(mocks.room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Покажи верхнюю карту основной стопки, положи ее на верх своей стопки. Если это хаос, вместо карты получи +3 эссенции',
      totalStrike: 'Каждый участник показывает 5 верхних карт стопки и перемещает в сброс те, у которых стоимость 1 или больше',
    });
  });

  it('Неактивные хендлеры возвращают false', () => {
    expect(card.canPlayStrikeHandler()).toBe(false);
    expect(card.canPlaySealHandler()).toBe(false);
    expect(card.canPlayEvadeHandler()).toBe(false);
  });

  it('Можно разыграть тотальный мракобой', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBe(true);
  });

  describe('playGeneralHandler', () => {
    it('Показывает верхнюю карту основной стопки и кладет на верх своей стопки', async () => {
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      const topCard = new MockCard({ room });
      room.deck.addCardToTop(topCard);
      vi.spyOn(room.socketService, 'showCards');

      void card.play();
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).toHaveBeenCalledTimes(1);
      expect(room.socketService.showCards).toHaveBeenCalledWith(expect.objectContaining({
        cards: expect.objectContaining({
          array: [topCard],
        }) as unknown,
        title: 'Верхняя карта основной стопки',
      }) as unknown);
      expect(activePlayer.deck.count).toBe(1);
      expect(activePlayer.deck.top).toBe(topCard);
    });

    it('Получает +3 эссенции если верхняя карта - Хаос', async () => {
      const chaosCard = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      room.deck.addCardToTop(chaosCard);
      vi.spyOn(room.socketService, 'showCards');

      void card.play();
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.essenceToSpend).toBe(3);
      expect(room.socketService.showCards).toHaveBeenCalledTimes(1);
    });

    it('Не делает ничего если основная стопка пуста', async () => {
      room.deck.clear();
      vi.spyOn(room.socketService, 'showCards');

      void card.play();
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).not.toHaveBeenCalled();
      expect(activePlayer.essenceToSpend).toBe(0);
    });
  });

  describe('playTotalDarknessStrikeHandler', () => {
    it('Показывает верхние 5 карт стопки каждого участника', async () => {
      // Добавляем карты в стопки участников
      for (let i = 0; i < 5; i++) {
        const card1 = new MockCard({ room, price: i });
        const card2 = new MockCard({ room, price: i });
        activePlayer.deck.addCardToTop(card1);
        player.deck.addCardToTop(card2);
      }

      vi.spyOn(room.socketService, 'showCards');
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      void card.playTotalDarknessStrike();
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).toHaveBeenCalledTimes(2);
      expect(activePlayer.tryEvade).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Тотальный мракобой. Будешь укрываться?',
      }));
      expect(player.tryEvade).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Тотальный мракобой. Будешь укрываться?',
      }));
    });

    it('Участник может укрыться от тотального мракобоя', async () => {
      const testCard = new MockCard({ room });
      activePlayer.deck.addCardToTop(testCard);
      player.deck.addCardToTop(testCard);

      vi.spyOn(room.socketService, 'showCards');
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      void card.playTotalDarknessStrike();
      await vi.advanceTimersToNextTimerAsync();

      // Активный участник укрылся, поэтому его карты не показываются
      expect(room.socketService.showCards).toHaveBeenCalledTimes(1);
      expect(room.socketService.showCards).toHaveBeenCalledWith(expect.objectContaining({
        title: `Верхние 5 карт стопки участника ${player.nickname}`,
      }));
    });

    it('Не показывает карты если стопка участника пуста', async () => {
      activePlayer.deck.clear();
      activePlayer.discard.clear();
      player.deck.clear();
      player.discard.clear();

      vi.spyOn(room.socketService, 'showCards');
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      void card.playTotalDarknessStrike();
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).not.toHaveBeenCalled();
    });

    it('Сбрасывает карты стоимостью 1 или больше', async () => {
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      const cheapCard = new MockCard({ room, price: 0 });
      const expensiveCard = new MockCard({ room, price: 2 });

      addCardToPlayerDeck(expensiveCard, activePlayer);
      addCardToPlayerDeck(cheapCard, activePlayer);

      vi.spyOn(room.socketService, 'showCards');
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      void card.playTotalDarknessStrike();
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).toHaveBeenCalledTimes(2);
      expect(activePlayer.discard.count).toBe(1);
    });
  });
});
