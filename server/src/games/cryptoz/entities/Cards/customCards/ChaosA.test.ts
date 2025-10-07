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
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { ChaosA } from './ChaosA';

describe('ChaosA', () => {
  let card: ChaosA;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    player.discardHand(player.hand);
    card = new ChaosA(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosA();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_A);
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
    const card = new ChaosA(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_A);
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
      general: 'Каждый участник может сбросить руку и взять 2 карты. Кто не сделает этого, берет Проклятую печать',
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
    it('Участник выбирает сбросить руку и взять 2 карты', async () => {
      const mockCard1 = new MockCard({ room });
      const mockCard2 = new MockCard({ room });
      addCardToPlayerHand(mockCard1, activePlayer);
      addCardToPlayerHand(mockCard2, activePlayer);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialActivePlayerDeck = activePlayer.deck.count;

      room.socketService.selectVariant = vi.fn().mockResolvedValue(1);

      await card.play({ tempPlayer: activePlayer });

      expect(activePlayer.hand.count).toBe(2);
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 2);
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck - 2);
      expect(room.socketService.selectVariant).toHaveBeenCalledTimes(2);
    });

    it('Участник выбирает получить проклятую печать', async () => {
      const mockCard1 = new MockCard({ room });
      addCardToPlayerHand(mockCard1, activePlayer);

      const initialActivePlayerHand = activePlayer.hand.count;
      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialCursedSeals = room.cursedSeals.count;

      room.socketService.selectVariant = vi.fn().mockResolvedValue(2);

      await card.play({ tempPlayer: activePlayer });

      expect(activePlayer.hand.count).toBe(initialActivePlayerHand);
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 1);
      expect(room.cursedSeals.count).toBe(initialCursedSeals - 2);
      expect(room.socketService.selectVariant).toHaveBeenCalledTimes(2);
    });

    it('Разные участники могут делать разные выборы', async () => {
      const mockCard1 = new MockCard({ room });
      const mockCard2 = new MockCard({ room });
      addCardToPlayerHand(mockCard1, activePlayer);
      addCardToPlayerHand(mockCard2, player);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDiscard = player.discard.count;
      const initialCursedSeals = room.cursedSeals.count;

      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      await card.play({ tempPlayer: activePlayer });

      // activePlayer сбросил руку и взял 2 карты
      expect(activePlayer.hand.count).toBe(2);
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard + 1); // +1 сброшенная карта

      // player получил проклятую печать
      expect(player.hand.count).toBe(1); // Рука не изменилась
      expect(player.discard.count).toBe(initialPlayerDiscard + 1); // +1 проклятая печать

      expect(room.cursedSeals.count).toBe(initialCursedSeals - 1); // -1 проклятая печать
      expect(room.socketService.selectVariant).toHaveBeenCalledTimes(2);
    });

    it('Не дает проклятую печать если они закончились', async () => {
      // Добавляем карту в руку
      const mockCard1 = new MockCard({ room });
      addCardToPlayerHand(mockCard1, activePlayer);

      // Убираем все проклятые печати
      room.cursedSeals.clear();

      const initialActivePlayerDiscard = activePlayer.discard.count;

      // Мокаем выбор "Получить Проклятую печать"
      room.socketService.selectVariant = vi.fn().mockResolvedValue(2);

      await card.play({ tempPlayer: activePlayer });

      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard); // Ничего не добавилось
      expect(room.cursedSeals.count).toBe(0); // Проклятых печатей нет
    });

    it('Не работает без tempPlayer', async () => {
      const result = await card.play();
      expect(result).toBe(undefined); // Карта не разыгрывается
    });
  });
});
