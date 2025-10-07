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

import { Discharge } from './Discharge';
import { ChaosQ } from './ChaosQ';

describe('ChaosQ', () => {
  let chaos: ChaosQ;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;

    chaos = new ChaosQ(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosQ();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Q);
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
    const card = new ChaosQ(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Q);
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
    expect(chaos.format().description).toEqual({
      general: 'Разыграй все мракобои на рынке. Если надо выбрать цель - выбирает тот, кто призвал хаос',
    });
  });

  it('canPlayGeneralHandler возвращает true', () => {
    expect(chaos.canPlayGeneralHandler()).toBeTruthy();
  });

  it('canPlayStrikeHandler возвращает false', () => {
    expect(chaos.canPlayStrikeHandler()).toBeFalsy();
  });

  it('canPlaySealHandler возвращает false', () => {
    expect(chaos.canPlaySealHandler()).toBeFalsy();
  });

  it('canPlayTotalDarknessStrikeHandler возвращает false', () => {
    expect(chaos.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('canPlayEvadeHandler возвращает false', () => {
    expect(chaos.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Хаос эффект', () => {
    it('Разыгрывает все мракобои на рынке против активного участника', async () => {
      // Очищаем рынок
      room.market.clear();

      // Добавляем карты с мракобоями на рынок
      const strikeCard1 = new Discharge(room);
      const strikeCard2 = new Discharge(room);
      const regularCard = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });

      room.market.addCardToBottom(strikeCard1);
      room.market.addCardToBottom(strikeCard2);
      room.market.addCardToBottom(regularCard);

      // Мокаем playStrike для карт с мракобоями
      vi.spyOn(strikeCard1, 'playStrike').mockImplementation(vi.fn());
      vi.spyOn(strikeCard2, 'playStrike').mockImplementation(vi.fn());

      await chaos.play({ tempPlayer: activePlayer });

      // Проверяем, что мракобои были разыграны против активного участника
      expect(strikeCard1.playStrike).toHaveBeenCalledTimes(1);
      expect(strikeCard1.playStrike).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        isForChaos: true,
      });
      expect(strikeCard2.playStrike).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        isForChaos: true,
      });
    });

    it('Не разыгрывает карты без мракобоев на рынке', async () => {
      // Очищаем рынок
      room.market.clear();

      // Добавляем только обычные карты на рынок
      const regularCard1 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
      const regularCard2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });

      room.market.addCardToBottom(regularCard1);
      room.market.addCardToBottom(regularCard2);

      // Мокаем playStrike для обычных карт
      vi.spyOn(regularCard1, 'playStrike');
      vi.spyOn(regularCard2, 'playStrike');

      await chaos.play({ tempPlayer: activePlayer });

      // Проверяем, что обычные карты не разыгрывались
      expect(regularCard1.playStrike).not.toHaveBeenCalled();
      expect(regularCard2.playStrike).not.toHaveBeenCalled();
    });

    it('Работает с пустым рынком', async () => {
      // Очищаем рынок
      room.market.clear();

      await chaos.play({ tempPlayer: activePlayer });
    });

    it('Не работает без активного участника', async () => {
      // Очищаем рынок
      room.market.clear();

      // Убираем активного участника
      room.activePlayerNickname = undefined;

      await chaos.play({ tempPlayer: activePlayer });
    });
  });
});
