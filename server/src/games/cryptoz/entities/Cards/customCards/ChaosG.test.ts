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
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosG } from './ChaosG';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosG', () => {
  let card: ChaosG;
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

    card = new ChaosG(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosG();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_G);
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
    const card = new ChaosG(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_G);
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
      general: 'Участники с максимальным и минимальным здоровьем меняются здоровьем',
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
    it('Участники с максимальным и минимальным здоровьем меняются местами', async () => {
      // Устанавливаем разное здоровье
      activePlayer.health = 5; // минимальное
      player.health = 15; // среднее
      thirdPlayer.health = 25; // максимальное

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer (был 5) должен получить 25
      expect(activePlayer.health).toBe(25);
      // player (был 15) не должен измениться
      expect(player.health).toBe(15);
      // thirdPlayer (был 25) должен получить 5
      expect(thirdPlayer.health).toBe(5);
    });

    it('Работает с несколькими участниками с одинаковым максимальным здоровьем', async () => {
      activePlayer.health = 5; // минимальное
      player.health = 20; // максимальное
      thirdPlayer.health = 20; // тоже максимальное

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // activePlayer получает максимальное здоровье
      expect(activePlayer.health).toBe(20);
      // Оба участника с максимальным здоровьем получают минимальное
      expect(player.health).toBe(5);
      expect(thirdPlayer.health).toBe(5);
    });

    it('Работает с несколькими участниками с одинаковым минимальным здоровьем', async () => {
      activePlayer.health = 3; // минимальное
      player.health = 3; // тоже минимальное
      thirdPlayer.health = 18; // максимальное

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Оба участника с минимальным здоровьем получают максимальное
      expect(activePlayer.health).toBe(18);
      expect(player.health).toBe(18);
      // Участник с максимальным здоровьем получает минимальное
      expect(thirdPlayer.health).toBe(3);
    });

    it('Не делает ничего если у всех участников одинаковое здоровье', async () => {
      activePlayer.health = 10;
      player.health = 10;
      thirdPlayer.health = 10;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Никто не должен измениться
      expect(activePlayer.health).toBe(10);
      expect(player.health).toBe(10);
      expect(thirdPlayer.health).toBe(10);
    });

    it('Не делает ничего если только один участник', async () => {
      const singlePlayer = activePlayer;
      singlePlayer.health = 15;

      void card.play({
        tempPlayer: singlePlayer,
        concreteTargets: new PlayerGroup([singlePlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      expect(singlePlayer.health).toBe(15);
    });

    it('Работает с двумя участниками', async () => {
      activePlayer.health = 8;
      player.health = 16;

      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, player]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // Участники должны поменяться здоровьем
      expect(activePlayer.health).toBe(16);
      expect(player.health).toBe(8);
    });

    it('Работает с конкретными участниками', async () => {
      activePlayer.health = 5;
      player.health = 15;
      thirdPlayer.health = 25;

      // Обмениваем здоровье только между activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(25); // получил от thirdPlayer
      expect(player.health).toBe(15); // не участвовал
      expect(thirdPlayer.health).toBe(5); // получил от activePlayer
    });
  });
});
