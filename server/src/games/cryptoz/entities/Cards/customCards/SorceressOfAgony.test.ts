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
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { SorceressOfAgony } from './SorceressOfAgony';

describe('SorceressOfAgony', () => {
  let card: SorceressOfAgony;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    player.discardHand(player.hand);
    card = new SorceressOfAgony(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SorceressOfAgony();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SORCERESS_OF_AGONY);
    expect(card.name).toBe('Чародейка агонии');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(12);
    expect(card.baseGloryShards).toBe(6);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SorceressOfAgony(room);
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SORCERESS_OF_AGONY);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+4 эссенции',
      strike: 'Нанеси 4 урона противнику',
      totalStrike: 'Каждый участник получает Проклятую печать за каждую карту стоимостью 4 и больше',
    });
  });

  describe('General', () => {
    it('Участник получает 4 эссенции', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      activePlayer.arena.addCardToTop(card);
      await card.playGeneral();
      expect(activePlayer.essenceToSpend).toBe(initialEssence + 4);
    });
  });

  describe('Strike', () => {
    it('Наносит 4 урона врагу', async () => {
      const initialHp = player.health;
      room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      activePlayer.arena.addCardToTop(card);
      await card.playStrike();

      expect(player.health).toBe(initialHp - 4);
    });

    it('Не наносит урон, если враг увернулся', async () => {
      const initialHp = player.health;
      room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
      player.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playStrike();

      expect(player.health).toBe(initialHp);
    });

    it('Ничего не происходит, если участник не выбран', async () => {
      const initialHp = player.health;
      room.socketService.selectTarget = vi.fn().mockResolvedValue(null);

      await card.playStrike();

      expect(player.health).toBe(initialHp);
    });
  });

  describe('Total Strike', () => {
    it('Участники получают проклятые печати за карты стоимостью 4 и больше', async () => {
      addCardToPlayerHand(new MockCard({ room, price: 5 }), player);
      addCardToPlayerHand(new MockCard({ room, price: 4 }), player);
      addCardToPlayerHand(new MockCard({ room, price: 3 }), player);

      const initialPlayerDiscard = player.discard.count;

      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(player.discard.count).toBe(initialPlayerDiscard + 2);
    });

    it('Не атакует участника, если он защищен', async () => {
      const initialPlayerDiscard = player.discard.count;
      player.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike({ target: player });

      expect(player.discard.count).toBe(initialPlayerDiscard);
    });

    it('Ничего не происходит, если у участника нет карт стоимостью 4 и больше', async () => {
      addCardToPlayerHand(new MockCard({ room, price: 3 }), player);
      const initialPlayerDiscard = player.discard.count;
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike({ target: player });

      expect(player.discard.count).toBe(initialPlayerDiscard);
    });
  });
});
