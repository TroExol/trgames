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
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosT } from './ChaosT';

describe('ChaosT', () => {
  let card: ChaosT;
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

    card = new ChaosT(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosT();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_T);
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
    const card = new ChaosT(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_T);
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
      strike: 'Противник слева может взять 2 карты',
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
    it('Левый участник берет 2 карты', async () => {
      // Мокаем tryEvade - участник не укрывается
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      // Мокаем takeCards
      vi.spyOn(player, 'takeCards').mockImplementation(() => {});

      await card.playStrike({ tempPlayer: activePlayer });

      // Проверяем, что takeCards был вызван с аргументом 2
      expect(player.takeCards).toHaveBeenCalledWith(2);
    });

    it('Участник может укрыться от эффекта', async () => {
      // Мокаем tryEvade - участник укрывается
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);

      // Мокаем takeCards
      vi.spyOn(player, 'takeCards').mockImplementation(() => {});

      await card.playStrike({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что takeCards не был вызван
      expect(player.takeCards).not.toHaveBeenCalled();
    });

    it('Не работает без левого участника', async () => {
      // Оставляем только одного участника
      room.players.removePlayer(player);
      room.players.removePlayer(thirdPlayer);

      // Мокаем tryEvade
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      await card.playStrike({ tempPlayer: activePlayer });
    });

    it('Левый участник получает карты в руку', async () => {
      // Мокаем tryEvade - участник не укрывается
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      // Очищаем руку левого участника и добавляем карты в стопку
      player.hand.clear();
      player.deck.clear();
      player.discard.clear();

      // Добавляем карты в сброс
      const card1 = new MockCard({ room });
      const card2 = new MockCard({ room });
      const card3 = new MockCard({ room });
      player.discard.addCardToTop(card1);
      player.discard.addCardToTop(card2);
      player.discard.addCardToTop(card3);

      await card.playStrike({ tempPlayer: activePlayer });

      // Проверяем, что левый участник получил 2 карты в руку
      expect(player.hand.count).toBe(2);
      expect(player.deck.count).toBe(1);
      expect(player.discard.count).toBe(0);
    });
  });
});
