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

import { SmolderingPlague } from './SmolderingPlague';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('SmolderingPlague', () => {
  let card: SmolderingPlague;
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
    card = new SmolderingPlague(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SmolderingPlague();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SMOLDERING_PLAGUE);
    expect(card.name).toBe('Тлеющая чума');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(10);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SmolderingPlague(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SMOLDERING_PLAGUE);
    expect(card.name).toBe('Тлеющая чума');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(10);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции. Противник получает Проклятую печать',
      totalStrike: 'Каждый участник уничтожает карты на руке, пока у него не останется только по 1 карте каждого типа',
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

  it('canPlayTotalDarknessStrikeHandler возвращает true', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeTruthy();
  });

  it('canPlayEvadeHandler возвращает false', () => {
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Основная способность', () => {
    it('Дает +2 эссенции и противник получает проклятую печать', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      const initialCursedSealsCount = room.cursedSeals.count;
      const initialPlayerHandCount = player.hand.count;

      room.socketService.selectTarget = vi.fn().mockResolvedValue(player);

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(player.hand.count).toBe(initialPlayerHandCount + 1);
      expect(player.hand.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).not.toBeNull();
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1);
    });

    it('Не работает если нет проклятых печатей', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      const initialPlayerHandCount = player.hand.count;

      room.cursedSeals.clear();

      room.socketService.selectTarget = vi.fn().mockResolvedValue(player);

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(player.hand.count).toBe(initialPlayerHandCount);
      expect(room.cursedSeals.count).toBe(0);
    });

    it('Не работает если не выбран противник', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      const initialCursedSealsCount = room.cursedSeals.count;

      room.socketService.selectTarget = vi.fn().mockResolvedValue(null);

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount);
    });
  });

  describe('Тотальный мракобой', () => {
    let mockCards: MockCard[];

    beforeEach(() => {
      mockCards = [
        new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT, name: 'Артефакт 1' }),
        new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT, name: 'Артефакт 2' }),
        new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT, name: 'Артефакт 3' }),
        new MockCard({ room, type: CryptozShared.ECardType.CREATURE, name: 'Существо 1' }),
        new MockCard({ room, type: CryptozShared.ECardType.CREATURE, name: 'Существо 2' }),
        new MockCard({ room, type: CryptozShared.ECardType.RITUAL, name: 'Ритуал 1' }),
      ];

      mockCards.forEach(mockCard => {
        addCardToPlayerHand(mockCard, activePlayer);
      });

      const playerCards = [
        new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS, name: 'Нечисть 1' }),
        new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS, name: 'Нечисть 2' }),
      ];
      playerCards.forEach(mockCard => {
        addCardToPlayerHand(mockCard, player);
      });
    });

    it('Каждый участник оставляет по 1 карте каждого типа', async () => {
      // Мокаем выборы карт для сохранения
      room.socketService.selectCards = vi.fn().mockImplementation(({ cards }) => {
        // Возвращаем первую карту из каждой группы
        return { cards: new CardGroup(ECardGroupType.ANY, [cards.array[0]]) };
      });

      await card.playTotalDarknessStrike();

      // У активного участника должно остаться 4 карты: 1 SmolderingPlague + 1 Артефакт + 1 Существо + 1 Ритуал
      expect(activePlayer.hand.count).toBe(4);

      // У второго участника должна остаться 1 карта: 1 Нечисть
      expect(player.hand.count).toBe(1);

      // Проверяем, что у активного участника есть по одной карте каждого типа
      expect(activePlayer.hand.getCountCardsByType(CryptozShared.ECardType.HARBINGER)).toBe(1); // SmolderingPlague
      expect(activePlayer.hand.getCountCardsByType(CryptozShared.ECardType.ARTIFACT)).toBe(1);
      expect(activePlayer.hand.getCountCardsByType(CryptozShared.ECardType.CREATURE)).toBe(1);
      expect(activePlayer.hand.getCountCardsByType(CryptozShared.ECardType.RITUAL)).toBe(1);

      // Проверяем, что у второго участника есть 1 карта нужного типа
      expect(player.hand.getCountCardsByType(CryptozShared.ECardType.WICKEDNESS)).toBe(1);
    });

    it('Работает с участниками без карт в руке', async () => {
      // Убираем все карты у второго участника
      player.discardHand(player.hand);

      room.socketService.selectCards = vi.fn().mockImplementation(({ cards }) => {
        return { cards: new CardGroup(ECardGroupType.ANY, [cards.array[0]]) };
      });

      await card.playTotalDarknessStrike();

      // У второго участника так и не должно быть карт
      expect(player.hand.count).toBe(0);

      // У активного участника должно остаться 4 карты
      expect(activePlayer.hand.count).toBe(4);
    });

    it('Работает когда участник не выбирает карту для сохранения', async () => {
      // Мокаем отсутствие выбора карт
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, []),
      });

      await card.playTotalDarknessStrike();

      // У активного участника должно остаться 4 карты (первые карты каждого типа)
      expect(activePlayer.hand.count).toBe(4);

      // У второго участника должна остаться 1 карта (первая карта типа)
      expect(player.hand.count).toBe(1);
    });

    it('Не делает ничего если у участника только по 1 карте каждого типа', async () => {
      activePlayer.hand.clear();
      addCardToPlayerHand(card, activePlayer);
      addCardToPlayerHand(mockCards[0], activePlayer); // Артефакт
      addCardToPlayerHand(mockCards[3], activePlayer); // Существо

      room.socketService.selectCards = vi.fn();

      const initialHandCount = activePlayer.hand.count;

      await card.playTotalDarknessStrike({ target: activePlayer });

      // Количество карт не должно измениться
      expect(activePlayer.hand.count).toBe(initialHandCount);

      // selectCards не должен быть вызван
      expect(room.socketService.selectCards).not.toHaveBeenCalled();
    });
  });
});
