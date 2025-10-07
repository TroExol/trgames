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

import { RulerOfNothingness } from './RulerOfNothingness';

describe('RulerOfNothingness', () => {
  let card: RulerOfNothingness;
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
    card = new RulerOfNothingness(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new RulerOfNothingness();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RULER_OF_NOTHINGNESS);
    expect(card.name).toBe('Правитель небытия');
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
    const card = new RulerOfNothingness(room);
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RULER_OF_NOTHINGNESS);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми все артефакты из сброса. Если их нет, +2 эссенции',
      totalStrike: 'Каждый участник получает 7 урона',
    });
  });

  describe('General', () => {
    it('Дает 2 эссенции, если нет артефактов в сбросе', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      await card.play();
      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    });

    it('Забирает все артефакты из сброса в руку', async () => {
      const artifact1 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
      const artifact2 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
      const notArtifact = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
      addCardToPlayerDiscard(artifact1, activePlayer);
      addCardToPlayerDiscard(artifact2, activePlayer);
      addCardToPlayerDiscard(notArtifact, activePlayer);

      const initialHandCount = activePlayer.hand.count;
      const initialDiscardCount = activePlayer.discard.count;

      await card.play();

      expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 2);
      expect(activePlayer.discard.count).toBe(initialDiscardCount - 2);
      expect(activePlayer.hand.getCard(artifact1)).not.toBeNull();
      expect(activePlayer.hand.getCard(artifact2)).not.toBeNull();
      expect(activePlayer.discard.getCard(notArtifact)).not.toBeNull();
    });
  });

  describe('Total Strike', () => {
    it('Наносит 7 урона всем участникам', async () => {
      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(initialActivePlayerHealth - 7);
      expect(player.health).toBe(initialPlayerHealth - 7);
    });

    it('Не наносит урон укрывшимся участникам', async () => {
      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(initialActivePlayerHealth);
      expect(player.health).toBe(initialPlayerHealth - 7);
    });

    it('Атакует только цель, если она указана', async () => {
      const initialActivePlayerHealth = activePlayer.health;
      const initialPlayerHealth = player.health;

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike({ target: player });

      expect(activePlayer.health).toBe(initialActivePlayerHealth);
      expect(player.health).toBe(initialPlayerHealth - 7);
    });
  });
});
