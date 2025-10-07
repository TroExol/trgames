import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import {
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosU } from './ChaosU';

describe('ChaosU', () => {
  let card: ChaosU;
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

    card = new ChaosU(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosU();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_U);
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
    const card = new ChaosU(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_U);
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
      strike: 'Все получают верхнюю карту основной стопки и получают урон, равный ее стоимости',
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
    it('Все участники получают верхнюю карту и урон', async () => {
      activePlayer.discard.clear();
      player.discard.clear();
      thirdPlayer.discard.clear();

      // Добавляем карту в основную стопку
      const topCard1 = new MockCard({ room, price: 5 });
      const topCard2 = new MockCard({ room, price: 3 });
      const topCard3 = new MockCard({ room, price: 1 });
      room.deck.clear();
      room.deck.addCardToBottom(topCard1);
      room.deck.addCardToBottom(topCard2);
      room.deck.addCardToBottom(topCard3);

      // Мокаем tryEvade - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.playStrike({ tempPlayer: activePlayer });

      // Проверяем, что все участники получили карту в руку
      expect(activePlayer.discard.getCard(topCard1)).toBe(topCard1);
      expect(player.discard.getCard(topCard2)).toBe(topCard2);
      expect(thirdPlayer.discard.getCard(topCard3)).toBe(topCard3);

      expect(activePlayer.health).toBe(15);
      expect(player.health).toBe(17);
      expect(thirdPlayer.health).toBe(19);

      // Проверяем, что карта была удалена из основной стопки
      expect(room.deck.getCard(topCard1)).toBeNull();
      expect(room.deck.getCard(topCard2)).toBeNull();
      expect(room.deck.getCard(topCard3)).toBeNull();
    });

    it('Участники могут укрыться от эффекта', async () => {
      // Добавляем карту в основную стопку
      const topCard1 = new MockCard({ room, price: 5 });
      const topCard2 = new MockCard({ room, price: 3 });
      const topCard3 = new MockCard({ room, price: 1 });
      room.deck.clear();
      room.deck.addCardToBottom(topCard1);
      room.deck.addCardToBottom(topCard2);
      room.deck.addCardToBottom(topCard3);

      // Мокаем tryEvade - один участник укрывается
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.playStrike({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что укрывшийся участник не получил карту и урон
      expect(activePlayer.discard.getCard(topCard1)).toBeNull();
      expect(activePlayer.health).toBe(20);

      // Проверяем, что остальные участники получили карту и урон
      expect(player.discard.getCard(topCard1)).toBe(topCard1);
      expect(thirdPlayer.discard.getCard(topCard2)).toBe(topCard2);
      expect(player.health).toBe(15);
      expect(thirdPlayer.health).toBe(17);
    });

    it('Работает с пустой основной стопкой', async () => {
      // Очищаем основную стопку
      room.deck.clear();

      // Мокаем tryEvade
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      await card.playStrike({ tempPlayer: activePlayer });
    });
  });
});
