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
import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosR } from './ChaosR';

describe('ChaosR', () => {
  let card: ChaosR;
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

    card = new ChaosR(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosR();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_R);
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
    const card = new ChaosR(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_R);
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
      general: 'Все выбирают один свой осколок Философского камня. Перемешай их и раздай каждому по одной. Разыграй полученный осколок',
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
    it('Собирает осколки у участников, перемешивает и раздает обратно', async () => {
      // Добавляем осколки участникам
      const stoneShard1 = new StoneShard1(room);
      const stoneShard2 = new StoneShard1(room);
      const stoneShard3 = new StoneShard1(room);

      activePlayer.stoneShards.addStoneShardToBottom(stoneShard1);
      player.stoneShards.addStoneShardToBottom(stoneShard2);
      thirdPlayer.stoneShards.addStoneShardToBottom(stoneShard3);

      stoneShard1.changeOwner(activePlayer.nickname);
      stoneShard2.changeOwner(player.nickname);
      stoneShard3.changeOwner(thirdPlayer.nickname);

      // Мокаем selectStoneShards для каждого участника
      vi.spyOn(room.socketService, 'selectStoneShards').mockImplementation(({ player: p }) => {
        if (p.nickname === activePlayer.nickname) {
          return Promise.resolve({
            stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1]),
            variant: undefined,
          });
        }
        if (p.nickname === player.nickname) {
          return Promise.resolve({
            stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard2]),
            variant: undefined,
          });
        }
        if (p.nickname === thirdPlayer.nickname) {
          return Promise.resolve({
            stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard3]),
            variant: undefined,
          });
        }

        return Promise.resolve({
          stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY),
          variant: undefined,
        });
      });

      // Мокаем play для осколков
      vi.spyOn(stoneShard1, 'play').mockResolvedValue();
      vi.spyOn(stoneShard2, 'play').mockResolvedValue();
      vi.spyOn(stoneShard3, 'play').mockResolvedValue();

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что selectStoneShards был вызван для каждого участника
      expect(room.socketService.selectStoneShards).toHaveBeenCalledTimes(3);

      // Проверяем, что осколки были разыграны
      expect(stoneShard1.play).toHaveBeenCalledTimes(1);
      expect(stoneShard2.play).toHaveBeenCalledTimes(1);
      expect(stoneShard3.play).toHaveBeenCalledTimes(1);
    });

    it('Работает с участниками без осколков', async () => {
      // Очищаем осколки у всех участников
      activePlayer.stoneShards.clear();
      player.stoneShards.clear();
      thirdPlayer.stoneShards.clear();

      // Мокаем selectStoneShards
      vi.spyOn(room.socketService, 'selectStoneShards').mockResolvedValue({
        stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY),
        variant: undefined,
      });

      await card.play({ tempPlayer: activePlayer });

      expect(room.socketService.selectStoneShards).not.toHaveBeenCalled();
    });

    it('Работает с конкретными целями', async () => {
      // Добавляем осколки только активному участнику
      const stoneShard1 = new StoneShard1(room);
      activePlayer.stoneShards.addStoneShardToBottom(stoneShard1);

      // Мокаем selectStoneShards
      vi.spyOn(room.socketService, 'selectStoneShards').mockResolvedValue({
        stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1]),
        variant: undefined,
      });

      // Мокаем play для осколка
      vi.spyOn(stoneShard1, 'play').mockResolvedValue();

      // Применяем только к activePlayer
      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer]),
      });

      // Проверяем, что selectStoneShards был вызван только для activePlayer
      expect(room.socketService.selectStoneShards).toHaveBeenCalledTimes(1);
      expect(stoneShard1.play).toHaveBeenCalled();
    });

    it('Обрабатывает случай, когда участник не выбрал осколок', async () => {
      // Добавляем осколки участникам
      const stoneShard1 = new StoneShard1(room);
      const stoneShard2 = new StoneShard1(room);

      activePlayer.stoneShards.addStoneShardToBottom(stoneShard1);
      player.stoneShards.addStoneShardToBottom(stoneShard2);

      // Мокаем selectStoneShards: activePlayer выбирает осколок, player - нет
      vi.spyOn(room.socketService, 'selectStoneShards')
        .mockResolvedValueOnce({
          stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1]),
          variant: undefined,
        })
        .mockResolvedValueOnce({
          stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY),
          variant: undefined,
        });

      // Мокаем play для осколка
      vi.spyOn(stoneShard1, 'play').mockResolvedValue();

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что selectStoneShards был вызван для обоих участников
      expect(room.socketService.selectStoneShards).toHaveBeenCalledTimes(2);
      // Проверяем, что только выбранный осколок был разыгран
      expect(stoneShard1.play).toHaveBeenCalled();
    });
  });
});
