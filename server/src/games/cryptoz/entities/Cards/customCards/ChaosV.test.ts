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
import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosV } from './ChaosV';

describe('ChaosV', () => {
  let card: ChaosV;
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
    const thirdPlayerSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(thirdPlayer.nickname, thirdPlayerSocket);

    card = new ChaosV(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosV();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_V);
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
    const card = new ChaosV(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_V);
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
      strike: 'Нанеси 3 урона каждому с 10 или меньше здоровья',
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
    it('Наносит урон только участникам с 10 или меньше здоровья', async () => {
      // Устанавливаем разное здоровье участникам
      activePlayer.health = 8; // Получит урон (≤ 10)
      player.health = 10; // Получит урон (= 10)
      thirdPlayer.health = 12; // Не получит урон (> 10)

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      // Мокаем takeDamage
      vi.spyOn(activePlayer, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeDamage').mockImplementation(vi.fn());

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что урон нанесен только участникам с 10 или меньше здоровья
      expect(activePlayer.takeDamage).toHaveBeenCalledWith(3);
      expect(player.takeDamage).toHaveBeenCalledWith(3);
      expect(thirdPlayer.takeDamage).not.toHaveBeenCalled();
    });

    it('Участники могут укрываться от эффекта', async () => {
      // Устанавливаем здоровье всем участникам
      activePlayer.health = 8;
      player.health = 10;
      thirdPlayer.health = 9;

      // Мокаем укрытие: activePlayer укрывается, остальные нет
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      // Мокаем takeDamage
      vi.spyOn(activePlayer, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeDamage').mockImplementation(vi.fn());

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // activePlayer укрылся - урон не нанесен
      expect(activePlayer.tryEvade).toHaveBeenCalled();
      expect(activePlayer.takeDamage).not.toHaveBeenCalled();

      // player и thirdPlayer не укрылись - урон нанесен
      expect(player.tryEvade).toHaveBeenCalled();
      expect(player.takeDamage).toHaveBeenCalledWith(3);
      expect(thirdPlayer.tryEvade).toHaveBeenCalled();
      expect(thirdPlayer.takeDamage).toHaveBeenCalledWith(3);
    });

    it('Работает с конкретными целями', async () => {
      // Устанавливаем здоровье всем участникам
      activePlayer.health = 8;
      player.health = 10;
      thirdPlayer.health = 12;

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      // Мокаем takeDamage
      vi.spyOn(activePlayer, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(player, 'takeDamage').mockImplementation(vi.fn());
      vi.spyOn(thirdPlayer, 'takeDamage').mockImplementation(vi.fn());

      // Применяем только к activePlayer и thirdPlayer
      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
        canEvade: true,
      });

      // Проверяем, что урон нанесен только выбранным участникам с подходящим здоровьем
      expect(activePlayer.takeDamage).toHaveBeenCalledWith(3);
      expect(player.takeDamage).not.toHaveBeenCalled(); // Не в целях
      expect(thirdPlayer.takeDamage).not.toHaveBeenCalled(); // В целях, но здоровье > 10
    });
  });
});
