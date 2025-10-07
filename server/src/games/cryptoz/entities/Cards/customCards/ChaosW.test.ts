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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';

import { ChaosW } from './ChaosW';

describe('ChaosW', () => {
  let card: ChaosW;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;

    card = new ChaosW(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosW();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_W);
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
    const card = new ChaosW(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_W);
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
      general: 'Разыграй тотальный мракобой текущего предвестника',
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
    it('Разыгрывает тотальный мракобой текущего предвестника', async () => {
      // Создаем мок предвестника
      const mockHarbinger = new MockCard({ room });
      mockHarbinger.canPlayTotalDarknessStrikeHandler = vi.fn().mockReturnValue(true);
      mockHarbinger.playTotalDarknessStrike = vi.fn().mockResolvedValue(true);

      // Добавляем предвестника в комнату
      room.harbingers.addCardToTop(mockHarbinger);

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что тотальный мракобой был разыгран
      expect(mockHarbinger.playTotalDarknessStrike).toHaveBeenCalledTimes(1);
    });

    it('Работает без предвестника', async () => {
      // Очищаем предвестников
      room.harbingers.clear();

      await card.play({ tempPlayer: activePlayer });
    });

    it('Не работает без tempPlayer', async () => {
      const result = await card.play();
      expect(result).toBe(undefined); // Карта не разыгрывается
    });

    it('Работает с конкретными целями', async () => {
      // Создаем мок предвестника
      const mockHarbinger = new MockCard({ room });
      mockHarbinger.canPlayTotalDarknessStrikeHandler = vi.fn().mockReturnValue(true);
      mockHarbinger.playTotalDarknessStrike = vi.fn().mockResolvedValue(true);

      // Добавляем предвестника в комнату
      room.harbingers.addCardToTop(mockHarbinger);

      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer]),
      });

      // Проверяем, что тотальный мракобой был разыгран
      expect(mockHarbinger.playTotalDarknessStrike).toHaveBeenCalledTimes(1);
    });
  });
});
