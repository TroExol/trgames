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
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosX } from './ChaosX';

describe('ChaosX', () => {
  let card: ChaosX;
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

    card = new ChaosX(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosX();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_X);
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
    const card = new ChaosX(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_X);
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
      general: 'Все подсчитывают стоимость карт в руке. Участники с наименьшей суммой берут 2 карты',
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
    it('Выдает карты участникам с наименьшей стоимостью карт в руке', async () => {
      // Создаем карты с разной стоимостью
      const cheapCard1 = new MockCard({ room, price: 1 });
      const cheapCard2 = new MockCard({ room, price: 2 });
      const expensiveCard1 = new MockCard({ room, price: 5 });
      const expensiveCard2 = new MockCard({ room, price: 6 });

      // Добавляем карты в руки участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.hand.addCardToTop(cheapCard1); // Стоимость: 1
      activePlayer.hand.addCardToTop(cheapCard2); // Стоимость: 2, общая: 3

      player.hand.addCardToTop(expensiveCard1); // Стоимость: 5
      player.hand.addCardToTop(expensiveCard2); // Стоимость: 6, общая: 11

      thirdPlayer.hand.addCardToTop(cheapCard1); // Стоимость: 1, общая: 1

      // Мокаем takeCards
      vi.spyOn(activePlayer, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeCards').mockImplementation(vi.fn());

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что карты получили только участники с минимальной стоимостью
      // thirdPlayer имеет стоимость 1 (минимальная)
      expect(thirdPlayer.takeCards).toHaveBeenCalledWith(2);
      // activePlayer и player не должны получить карты
      expect(activePlayer.takeCards).not.toHaveBeenCalled();
      expect(player.takeCards).not.toHaveBeenCalled();
    });

    it('Выдает карты всем участникам с одинаковой минимальной стоимостью', async () => {
      // Создаем карты с одинаковой стоимостью
      const card1 = new MockCard({ room, price: 3 });
      const card2 = new MockCard({ room, price: 3 });

      // Добавляем карты в руки участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.hand.addCardToTop(card1); // Стоимость: 3
      player.hand.addCardToTop(card2); // Стоимость: 3
      // thirdPlayer пустая рука - стоимость: 0

      // Мокаем takeCards
      vi.spyOn(activePlayer, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeCards').mockImplementation(vi.fn());

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что карты получил только thirdPlayer (стоимость 0 - минимальная)
      expect(thirdPlayer.takeCards).toHaveBeenCalledWith(2);
      expect(activePlayer.takeCards).not.toHaveBeenCalled();
      expect(player.takeCards).not.toHaveBeenCalled();
    });

    it('Работает с пустыми руками', async () => {
      // Очищаем руки всех участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      // Мокаем takeCards
      vi.spyOn(activePlayer, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeCards').mockImplementation(vi.fn());

      await card.play({ tempPlayer: activePlayer });

      // Все участники должны получить карты, так как у всех стоимость 0
      expect(activePlayer.takeCards).toHaveBeenCalledWith(2);
      expect(player.takeCards).toHaveBeenCalledWith(2);
      expect(thirdPlayer.takeCards).toHaveBeenCalledWith(2);
    });

    it('Не работает без tempPlayer', async () => {
      const result = await card.play();
      expect(result).toBe(undefined); // Карта не разыгрывается
    });

    it('Работает с конкретными целями', async () => {
      // Создаем карты с разной стоимостью
      const cheapCard = new MockCard({ room, price: 1 });
      const expensiveCard = new MockCard({ room, price: 5 });

      // Добавляем карты в руки участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      activePlayer.hand.addCardToTop(cheapCard); // Стоимость: 1
      player.hand.addCardToTop(expensiveCard); // Стоимость: 5
      thirdPlayer.hand.addCardToTop(cheapCard); // Стоимость: 1

      // Мокаем takeCards
      vi.spyOn(activePlayer, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeCards').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeCards').mockImplementation(vi.fn());

      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });

      // Проверяем, что карты получили только участники с минимальной стоимостью среди целей
      expect(activePlayer.takeCards).toHaveBeenCalledWith(2);
      expect(thirdPlayer.takeCards).toHaveBeenCalledWith(2);
      expect(player.takeCards).not.toHaveBeenCalled(); // Не в целях
    });
  });
});
