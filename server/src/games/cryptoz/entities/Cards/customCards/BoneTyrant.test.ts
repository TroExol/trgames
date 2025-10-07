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
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { BoneTyrant } from './BoneTyrant';

describe('BoneTyrant', () => {
  let card: BoneTyrant;
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
    card = new BoneTyrant(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new BoneTyrant();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BONE_TYRANT);
    expect(card.name).toBe('Костяной Тиран');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(11);
    expect(card.baseGloryShards).toBe(6);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new BoneTyrant(room);
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BONE_TYRANT);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми все ритуалы из сброса. Если их нет, +2 эссенции',
      totalStrike: 'Каждый участник раскрывает свою руку и получает 3 урона за каждый осколок величия на картах',
    });
  });

  describe('General', () => {
    it('Дает 2 эссенции, если нет ритуалов в сбросе', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      await card.play();
      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    });

    it('Забирает все ритуалы из сброса в руку', async () => {
      const ritual1 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
      const ritual2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
      const notRitual = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
      addCardToPlayerDiscard(ritual1, activePlayer);
      addCardToPlayerDiscard(ritual2, activePlayer);
      addCardToPlayerDiscard(notRitual, activePlayer);

      const initialHandCount = activePlayer.hand.count;
      const initialDiscardCount = activePlayer.discard.count;

      await card.play();

      expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 2);
      expect(activePlayer.discard.count).toBe(initialDiscardCount - 2);
      expect(activePlayer.hand.getCard(ritual1)).not.toBeNull();
      expect(activePlayer.hand.getCard(ritual2)).not.toBeNull();
      expect(activePlayer.discard.getCard(notRitual)).not.toBeNull();
    });
  });

  describe('Total Strike', () => {
    it('Наносит урон в зависимости от осколков славы в руке участника', async () => {
      const cardWithGlory1 = new MockCard({ room });
      vi.spyOn(cardWithGlory1, 'getGloryShards').mockReturnValue(2);
      const cardWithGlory2 = new MockCard({ room });
      vi.spyOn(cardWithGlory2, 'getGloryShards').mockReturnValue(3);
      addCardToPlayerHand(cardWithGlory1, player);
      addCardToPlayerHand(cardWithGlory2, player); // 5 осколков * 3 = 15 урона

      const initialPlayerHealth = player.health;
      player.tryEvade = vi.fn().mockResolvedValue(false);
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true); // activePlayer уклоняется

      await card.playTotalDarknessStrike();

      expect(player.health).toBe(initialPlayerHealth - 15);
    });

    it('Не наносит урон, если нет осколков славы у участника', async () => {
      const cardWithoutGlory = new MockCard({ room });
      vi.spyOn(cardWithoutGlory, 'getGloryShards').mockReturnValue(0);
      addCardToPlayerHand(cardWithoutGlory, player);

      const initialPlayerHealth = player.health;
      player.tryEvade = vi.fn().mockResolvedValue(false);
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike();

      expect(player.health).toBe(initialPlayerHealth);
    });

    it('Не наносит урон укрывшемуся участнику', async () => {
      const cardWithGlory = new MockCard({ room });
      vi.spyOn(cardWithGlory, 'getGloryShards').mockReturnValue(2);
      addCardToPlayerHand(cardWithGlory, player);

      const initialPlayerHealth = player.health;
      player.tryEvade = vi.fn().mockResolvedValue(true);
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike();

      expect(player.health).toBe(initialPlayerHealth);
    });
  });
});
