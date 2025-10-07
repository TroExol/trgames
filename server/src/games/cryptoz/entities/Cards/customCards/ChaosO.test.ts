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
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { Discharge } from './Discharge';
import { ChaosO } from './ChaosO';

describe('ChaosO', () => {
  let card: ChaosO;
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

    card = new ChaosO(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosO();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_O);
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
    const card = new ChaosO(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_O);
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
      general: 'Все показывают свою руку и разыгрывают мракобои против себя',
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
    it('Показывает карты из рук всех участников с подписями владельцев', async () => {
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      const card1 = new MockCard({ room, price: 2 });
      const card2 = new MockCard({ room, price: 3 });
      const card3 = new MockCard({ room, price: 1 });

      addCardToPlayerHand(card1, activePlayer);
      addCardToPlayerHand(card2, player);
      addCardToPlayerHand(card3, thirdPlayer);

      vi.spyOn(room.socketService, 'showCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.showCards).toHaveBeenCalledTimes(room.players.count);
    });

    it('Разыгрывает мракобои против себя', async () => {
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      // Создаем карты с мракобоями
      const strikeCard1 = new Discharge(room);
      const strikeCard2 = new Discharge(room);
      const regularCard = new MockCard({ room });

      addCardToPlayerHand(strikeCard1, activePlayer);
      addCardToPlayerHand(strikeCard2, player);
      addCardToPlayerHand(regularCard, thirdPlayer);

      // Мокаем playStrike для карт с мракобоями
      vi.spyOn(strikeCard1, 'playStrike').mockImplementation(vi.fn());
      vi.spyOn(strikeCard2, 'playStrike').mockImplementation(vi.fn());

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем, что мракобои были разыграны против своих владельцев
      expect(strikeCard1.playStrike).toHaveBeenCalledWith({
        concreteTarget: activePlayer,
        isForChaos: true,
      });
      expect(strikeCard2.playStrike).toHaveBeenCalledWith({
        concreteTarget: player,
        isForChaos: true,
      });
    });

    it('Не разыгрывает карты без мракобоев', async () => {
      // Создаем только обычные карты
      const regularCard1 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
      const regularCard2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });

      addCardToPlayerHand(regularCard1, activePlayer);
      addCardToPlayerHand(regularCard2, player);

      // Мокаем playStrike для обычных карт
      vi.spyOn(regularCard1, 'playStrike');
      vi.spyOn(regularCard2, 'playStrike');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем, что обычные карты не разыгрывались
      expect(regularCard1.playStrike).not.toHaveBeenCalled();
      expect(regularCard2.playStrike).not.toHaveBeenCalled();
    });

    it('Работает с пустыми руками', async () => {
      // Очищаем руки всех участников
      activePlayer.hand.clear();
      player.hand.clear();
      thirdPlayer.hand.clear();

      vi.spyOn(room.socketService, 'showCards');

      void card.play({ tempPlayer: activePlayer });
      await vi.advanceTimersToNextTimerAsync();

      // Показ карт не должен вызываться, так как руки пустые
      expect(room.socketService.showCards).not.toHaveBeenCalled();
    });

    it('Работает с конкретными целями', async () => {
      const strikeCard1 = new Discharge(room);
      const strikeCard2 = new Discharge(room);
      const regularCard = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });

      addCardToPlayerHand(strikeCard1, activePlayer);
      addCardToPlayerHand(strikeCard2, player);
      addCardToPlayerHand(regularCard, thirdPlayer);

      // Мокаем playStrike
      vi.spyOn(strikeCard1, 'playStrike').mockImplementation(vi.fn());
      vi.spyOn(strikeCard2, 'playStrike').mockImplementation(vi.fn());

      // Применяем только к activePlayer и thirdPlayer
      void card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
      });
      await vi.advanceTimersToNextTimerAsync();

      // Проверяем, что мракобой разыгрался только для activePlayer
      expect(strikeCard1.playStrike).toHaveBeenCalledWith({
        concreteTarget: activePlayer,
        isForChaos: true,
      });
      // strikeCard2 не должен разыгрываться, так как player не в целях
      expect(strikeCard2.playStrike).not.toHaveBeenCalled();
    });
  });
});
