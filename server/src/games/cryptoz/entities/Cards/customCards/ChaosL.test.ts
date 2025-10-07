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
import {
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosL } from './ChaosL';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosL', () => {
  let card: ChaosL;
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

    card = new ChaosL(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosL();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_L);
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
    const card = new ChaosL(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_L);
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
      general: 'Разыграй 2 случайных хаоса из стопки удаленных',
    });
  });

  it('canPlayGeneralHandler возвращает true', () => {
    room.removed.chaos.clear();
    room.removed.chaos.addCardToTop(new MockCard({ room, type: CryptozShared.ECardType.CHAOS }));
    room.removed.chaos.addCardToTop(new MockCard({ room, type: CryptozShared.ECardType.CHAOS }));

    expect(card.canPlayGeneralHandler()).toBeTruthy();
  });

  it('canPlayGeneralHandler возвращает false', () => {
    room.removed.chaos.clear();
    expect(card.canPlayGeneralHandler()).toBeFalsy();
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
    it('Разыгрывает 2 случайных хаоса из стопки удаленных', async () => {
      // Очищаем стопку удаленных хаосов и добавляем тестовые хаосы
      room.removed.chaos.clear();

      // Создаем мок-хаосы с простыми эффектами для тестирования
      const chaos1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      const chaos2 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      const chaos3 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });

      // Мокаем методы play для отслеживания вызовов
      vi.spyOn(chaos1, 'play').mockResolvedValue();
      vi.spyOn(chaos2, 'play').mockResolvedValue();
      vi.spyOn(chaos3, 'play').mockResolvedValue();

      room.removed.chaos.addCardToTop(chaos1);
      room.removed.chaos.addCardToTop(chaos2);
      room.removed.chaos.addCardToTop(chaos3);

      const initialChaosCount = room.removed.chaos.count; // 3

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Карты должны остаться в стопке удаленных (не удаляются)
      expect(room.removed.chaos.count).toBe(initialChaosCount);

      // Должно быть разыграно ровно 2 хаоса
      const playedChaosCount = [chaos1.play, chaos2.play, chaos3.play]
        .filter(spy => (spy as any).mock.calls.length > 0).length;
      expect(playedChaosCount).toBe(2);
    });

    it('Разыгрывает только 1 хаос если в стопке только 1', async () => {
      room.removed.chaos.clear();

      const chaos1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      vi.spyOn(chaos1, 'play').mockResolvedValue();

      room.removed.chaos.addCardToTop(chaos1);

      const initialChaosCount = room.removed.chaos.count; // 1

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Карта должна остаться в стопке удаленных
      expect(room.removed.chaos.count).toBe(initialChaosCount);
      expect(initialChaosCount).toBe(1);

      // Должен быть разыгран 1 хаос
      expect(chaos1.play).toHaveBeenCalledOnce();
    });

    it('Ничего не происходит если стопка удаленных хаосов пуста', async () => {
      room.removed.chaos.clear();

      const initialChaosCount = room.removed.chaos.count; // 0

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Ничего не должно измениться
      expect(room.removed.chaos.count).toBe(initialChaosCount);
      expect(room.removed.chaos.count).toBe(0);
    });

    it('Передает правильные параметры при разыгрывании хаосов', async () => {
      room.removed.chaos.clear();

      const chaos1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      vi.spyOn(chaos1, 'play').mockResolvedValue();

      room.removed.chaos.addCardToTop(chaos1);

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем что хаос был разыгран с правильными параметрами
      expect(chaos1.play).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        concreteTargets: undefined,
        isForChaos: true,
      });
    });

    it('Передает concreteTargets при разыгрывании хаосов', async () => {
      room.removed.chaos.clear();

      const chaos1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      vi.spyOn(chaos1, 'play').mockResolvedValue();

      room.removed.chaos.addCardToTop(chaos1);

      const targets = new PlayerGroup([activePlayer, player]);

      void card.play({
        tempPlayer: activePlayer,
        isForChaos: true,
        concreteTargets: targets,
      });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем что хаос был разыгран с переданными целями
      expect(chaos1.play).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        concreteTargets: targets,
        isForChaos: true,
      });
    });

    it('Хаосы разыгрываются последовательно', async () => {
      room.removed.chaos.clear();
      vi.useRealTimers();

      const chaos1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      const chaos2 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });

      // Отслеживаем порядок выполнения
      const executionOrder: string[] = [];

      vi.spyOn(chaos1, 'play').mockImplementation(async () => {
        // Имитируем асинхронное выполнение
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('chaos1');
      });

      vi.spyOn(chaos2, 'play').mockImplementation(async () => {
        // Имитируем асинхронное выполнение
        await new Promise(resolve => setTimeout(resolve, 5));
        executionOrder.push('chaos2');
      });

      room.removed.chaos.addCardToTop(chaos1);
      room.removed.chaos.addCardToTop(chaos2);

      await card.play({ tempPlayer: activePlayer });

      // Проверяем что оба хаоса были разыграны
      expect(executionOrder).toHaveLength(2);
      expect(executionOrder).toContain('chaos1');
      expect(executionOrder).toContain('chaos2');
    });

    it('Работает с хаосами разных типов', async () => {
      room.removed.chaos.clear();

      // Добавляем карты участникам для взаимодействия с хаосами
      activePlayer.hand.clear();
      player.hand.clear();

      const activePlayerCard = new MockCard({ room });
      const playerCard = new MockCard({ room });
      addCardToPlayerHand(activePlayerCard, activePlayer);
      addCardToPlayerHand(playerCard, player);

      // Создаем разные типы хаосов
      const chaosWithEffect1 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      const chaosWithEffect2 = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });

      // Первый хаос "отнимает" по карте у участников
      vi.spyOn(chaosWithEffect1, 'play').mockImplementation(() => {
        if (activePlayer.hand.count > 0) {
          const card = activePlayer.hand.top;
          if (card) {
            activePlayer.hand.removeCard(card);
          }
        }
        if (player.hand.count > 0) {
          const card = player.hand.top;
          if (card) {
            player.hand.removeCard(card);
          }
        }
        return Promise.resolve();
      });

      // Второй хаос "лечит" участников
      vi.spyOn(chaosWithEffect2, 'play').mockImplementation(() => {
        activePlayer.health = Math.min(activePlayer.health + 5, 25);
        player.health = Math.min(player.health + 5, 25);
        return Promise.resolve();
      });

      room.removed.chaos.addCardToTop(chaosWithEffect1);
      room.removed.chaos.addCardToTop(chaosWithEffect2);

      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем результаты эффектов хаосов
      expect(activePlayer.hand.count).toBe(0); // карта удалена
      expect(player.hand.count).toBe(0); // карта удалена
      expect(activePlayer.health).toBe(initialActivePlayerHealth + 5); // здоровье восстановлено
      expect(player.health).toBe(initialPlayerHealth + 5); // здоровье восстановлено
    });
  });
});
