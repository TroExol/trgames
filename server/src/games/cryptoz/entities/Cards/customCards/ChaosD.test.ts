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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { ChaosD } from './ChaosD';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosD', () => {
  let card: ChaosD;
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

    card = new ChaosD(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosD();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_D);
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
    const card = new ChaosD(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_D);
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
      general: 'Каждый участник может заплатить 4 здоровья, чтобы уничтожить карту из руки. Можешь повторять, пока больше 4 здоровья',
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
    it('Участник платит здоровье и уничтожает карту', async () => {
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;
      const initialRemovedCount = room.removed.cards.count;

      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // Заплатить здоровье
        .mockResolvedValueOnce(2); // Остановиться

      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [handCard]),
        variant: 1,
      });

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialHealth - 4);
      expect(activePlayer.hand.count).toBe(initialHandCount - 1);
      expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
      expect(room.removed.cards.array).toContain(handCard);
    });

    it('Участник может повторить процесс несколько раз', async () => {
      const handCard1 = new MockCard({ room });
      const handCard2 = new MockCard({ room });
      addCardToPlayerHand(handCard1, activePlayer);
      addCardToPlayerHand(handCard2, activePlayer);

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      // Участник дважды выбирает заплатить здоровье, затем останавливается
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // Первый раз - заплатить
        .mockResolvedValueOnce(1) // Второй раз - заплатить
        .mockResolvedValueOnce(2); // Остановиться

      // Участник выбирает карты для уничтожения
      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [handCard1]),
          variant: 1,
        })
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [handCard2]),
          variant: 1,
        });

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialHealth - 8); // 2 * 4 здоровья
      expect(activePlayer.hand.count).toBe(initialHandCount - 2); // 2 карты уничтожены
      expect(room.removed.cards.count).toBe(2);
      expect(room.removed.cards.array).toEqual(expect.arrayContaining([handCard1, handCard2]));
    });

    it('Участник с недостаточным здоровьем не может использовать эффект', async () => {
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);

      vi.spyOn(room.socketService, 'selectVariant');

      // Устанавливаем здоровье меньше 5
      activePlayer.health = 4;

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      // Никаких изменений не должно быть
      expect(activePlayer.health).toBe(initialHealth);
      expect(activePlayer.hand.count).toBe(initialHandCount);
      expect(room.socketService.selectVariant).not.toHaveBeenCalled();
    });

    it('Участник без карт на руке не может использовать эффект', async () => {
      // Очищаем руку
      activePlayer.discardHand(activePlayer.hand);

      vi.spyOn(room.socketService, 'selectVariant');
      const initialHealth = activePlayer.health;

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialHealth);
      expect(room.socketService.selectVariant).not.toHaveBeenCalled();
    });

    it('Участник решает остановиться с первого раза', async () => {
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);

      vi.spyOn(room.socketService, 'selectCards');

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      // Участник сразу выбирает остановиться
      room.socketService.selectVariant = vi.fn().mockResolvedValue(2);

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialHealth);
      expect(activePlayer.hand.count).toBe(initialHandCount);
      expect(room.socketService.selectCards).not.toHaveBeenCalled();
    });

    it('Участник платит здоровье, но пытается избежать уничтожения', async () => {
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);

      const initialHealth = activePlayer.health;
      const initialHandCount = activePlayer.hand.count;

      // Участник выбирает заплатить здоровье, затем останавливается
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // Заплатить здоровье
        .mockResolvedValueOnce(2); // Остановиться

      // Участник выбирает не уничтожать карту
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, []),
        variant: 2, // Оставить карты
      });

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialHealth - 4); // Здоровье потрачено
      expect(activePlayer.hand.count).toBe(initialHandCount); // Карта не уничтожена
      expect(room.removed.cards.count).toBe(0);
    });

    it('Разные участники делают разные выборы', async () => {
      const handCard1 = new MockCard({ room });
      const handCard2 = new MockCard({ room });
      addCardToPlayerHand(handCard1, activePlayer);
      addCardToPlayerHand(handCard2, player);

      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      // activePlayer заплатит здоровье, player откажется
      room.socketService.selectVariant = vi.fn()
        .mockResolvedValueOnce(1) // activePlayer платит
        .mockResolvedValueOnce(2) // activePlayer останавливается
        .mockResolvedValueOnce(2); // player сразу останавливается

      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [handCard1]),
        variant: 1,
      });

      void card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer, player]) });
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.health).toBe(initialActivePlayerHealth - 4);
      expect(player.health).toBe(initialPlayerHealth); // Не изменилось
      expect(room.removed.cards.count).toBe(1);
      expect(room.removed.cards.array).toContain(handCard1);
    });
  });
});
