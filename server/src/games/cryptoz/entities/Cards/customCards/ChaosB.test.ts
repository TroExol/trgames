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

import { ChaosB } from './ChaosB';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosB', () => {
  let card: ChaosB;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let playerMaxHp: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;

    // Создаем участника с максимальным здоровьем
    playerMaxHp = new Player({ nickname: 'playerMaxHp', room, participant: 'player' });
    room.players.addPlayerToBottom(playerMaxHp);
    const playerMaxHpSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(playerMaxHp.nickname, playerMaxHpSocket);
    playerMaxHp.health = 25; // максимальное здоровье

    card = new ChaosB(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosB();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_B);
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
    const card = new ChaosB(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_B);
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
      strike: 'Нанеси 6 урона участникам с наибольшим здоровьем',
    });
  });

  it('canPlayGeneralHandler возвращает false', () => {
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('canPlayStrikeHandler возвращает true', () => {
    expect(card.canPlayStrikeHandler()).toBeTruthy();
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

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Хаос мракобой', () => {
    it('Атакует участника с наибольшим здоровьем', async () => {
      // Устанавливаем разное здоровье
      activePlayer.health = 15;
      player.health = 20;
      playerMaxHp.health = 25; // максимальное здоровье

      vi.spyOn(playerMaxHp, 'tryEvade').mockResolvedValue(false);

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(playerMaxHp.health).toBe(19); // 25 - 6 = 19
      expect(activePlayer.health).toBe(15); // не изменилось
      expect(player.health).toBe(20); // не изменилось
    });

    it('Не атакует если участник укрылся', async () => {
      activePlayer.health = 15;
      player.health = 20;
      playerMaxHp.health = 25; // максимальное здоровье

      vi.spyOn(playerMaxHp, 'tryEvade').mockResolvedValue(true);

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(playerMaxHp.health).toBe(25); // здоровье не изменилось
      expect(activePlayer.health).toBe(15);
      expect(player.health).toBe(20);
    });

    it('Атакует конкретную цель если указана', async () => {
      activePlayer.health = 15;
      player.health = 20;
      playerMaxHp.health = 25;

      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([player]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(player.health).toBe(14); // 20 - 6 = 14
      expect(playerMaxHp.health).toBe(25); // не атакован
      expect(activePlayer.health).toBe(15);
    });
  });
});
