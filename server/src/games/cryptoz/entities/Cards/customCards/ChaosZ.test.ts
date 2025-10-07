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
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosZ } from './ChaosZ';

describe('ChaosZ', () => {
  let card: ChaosZ;
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

    card = new ChaosZ(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosZ();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Z);
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
    const card = new ChaosZ(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Z);
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
      strike: 'Все сбрасывают печати на арене',
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
    it('Все участники сбрасывают печати на арену', async () => {
      // Создаем печати для участников
      const seal1 = new MockCard({ room, name: 'Печать 1', isSeal: true });
      const seal2 = new MockCard({ room, name: 'Печать 2', isSeal: true });
      const seal3 = new MockCard({ room, name: 'Печать 3', isSeal: true });

      // Устанавливаем печати участникам
      activePlayer.seals.addCardToTop(seal1);
      player.seals.addCardToTop(seal2);
      thirdPlayer.seals.addCardToTop(seal3);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      expect(activePlayer.seals.count).toBe(0);
      expect(player.seals.count).toBe(0);
      expect(thirdPlayer.seals.count).toBe(0);
    });

    it('Участники могут укрываться от эффекта', async () => {
      // Создаем печати для участников
      const seal1 = new MockCard({ room, name: 'Печать 1', isSeal: true });
      const seal2 = new MockCard({ room, name: 'Печать 2', isSeal: true });
      const seal3 = new MockCard({ room, name: 'Печать 3', isSeal: true });

      // Устанавливаем печати участникам
      activePlayer.seals.addCardToTop(seal1);
      player.seals.addCardToTop(seal2);
      thirdPlayer.seals.addCardToTop(seal3);

      // activePlayer укрывается, остальные нет
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      expect(activePlayer.seals.count).toBe(1);
      expect(player.seals.count).toBe(0);
      expect(thirdPlayer.seals.count).toBe(0);
    });

    it('Работает с участниками без печатей', async () => {
      // Устанавливаем печати только некоторым участникам
      const seal1 = new MockCard({ room, name: 'Печать 1', isSeal: true });
      const seal3 = new MockCard({ room, name: 'Печать 3', isSeal: true });

      activePlayer.seals.addCardToTop(seal1);
      thirdPlayer.seals.addCardToTop(seal3);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что только участники с печатями сбросили их
      expect(activePlayer.seals.count).toBe(0);
      expect(player.seals.count).toBe(0);
      expect(thirdPlayer.seals.count).toBe(0);
    });

    it('Работает с конкретными целями', async () => {
      // Создаем печати для участников
      const seal1 = new MockCard({ room, name: 'Печать 1', isSeal: true });
      const seal2 = new MockCard({ room, name: 'Печать 2', isSeal: true });
      const seal3 = new MockCard({ room, name: 'Печать 3', isSeal: true });

      // Устанавливаем печати участникам
      activePlayer.seals.addCardToTop(seal1);
      player.seals.addCardToTop(seal2);
      thirdPlayer.seals.addCardToTop(seal3);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
        canEvade: true,
      });

      expect(activePlayer.seals.count).toBe(0);
      expect(player.seals.count).toBe(1);
      expect(thirdPlayer.seals.count).toBe(0);
    });

    it('Работает когда у всех участников нет печатей', async () => {
      // Устанавливаем null печати всем участникам
      activePlayer.seals.clear();
      player.seals.clear();
      thirdPlayer.seals.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      expect(activePlayer.seals.count).toBe(0);
      expect(player.seals.count).toBe(0);
      expect(thirdPlayer.seals.count).toBe(0);
    });
  });
});
