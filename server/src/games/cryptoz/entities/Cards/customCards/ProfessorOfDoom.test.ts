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
import { EssenceModifier } from '@/games/cryptoz/customModifiers/EssenceModifier';

import { ProfessorOfDoom } from './ProfessorOfDoom';

describe('ProfessorOfDoom', () => {
  let card: ProfessorOfDoom;
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
    card = new ProfessorOfDoom(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ProfessorOfDoom();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PROFESSOR_OF_DOOM);
    expect(card.name).toBe('Профессор Рока');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
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
    const card = new ProfessorOfDoom(room);
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PROFESSOR_OF_DOOM);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Удвой свою эссенцию на этот ход',
      totalStrike: 'Каждый участник сбрасывает все карты стоимостью 5 и больше',
    });
  });

  describe('General', () => {
    it('Удваивает эссенцию участника', async () => {
      activePlayer.addEssenceOnTurn(5);
      await card.play();
      expect(activePlayer.essenceToSpend).toBe(10);
    });

    it('Корректно работает с модификаторами', async () => {
      activePlayer.addEssenceOnTurn(5);
      activePlayer.modifiersEssence.addModifier(new EssenceModifier('test', val => val + 2)); // 5 + 2 = 7
      await card.play(); // 7 * 2 = 14
      expect(activePlayer.essenceToSpend).toBe(14);
    });
  });

  describe('Total Strike', () => {
    it('Сбрасывает карты стоимостью 5 и больше', async () => {
      const cardToDiscard1 = new MockCard({ room });
      vi.spyOn(cardToDiscard1, 'getPrice').mockReturnValue(5);
      const cardToDiscard2 = new MockCard({ room });
      vi.spyOn(cardToDiscard2, 'getPrice').mockReturnValue(6);
      const cardToKeep = new MockCard({ room });
      vi.spyOn(cardToKeep, 'getPrice').mockReturnValue(4);

      addCardToPlayerHand(cardToDiscard1, player);
      addCardToPlayerHand(cardToDiscard2, player);
      addCardToPlayerHand(cardToKeep, player);

      const initialHandCount = player.hand.count;
      player.tryEvade = vi.fn().mockResolvedValue(false);
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike();

      expect(player.hand.count).toBe(initialHandCount - 2);
      expect(player.hand.getCard(cardToKeep)).not.toBeNull();
      expect(player.discard.getCard(cardToDiscard1)).not.toBeNull();
      expect(player.discard.getCard(cardToDiscard2)).not.toBeNull();
    });

    it('Не сбрасывает карты, если участник укрылся', async () => {
      const cardToDiscard = new MockCard({ room });
      vi.spyOn(cardToDiscard, 'getPrice').mockReturnValue(5);
      addCardToPlayerHand(cardToDiscard, player);

      const initialHandCount = player.hand.count;
      player.tryEvade = vi.fn().mockResolvedValue(true);
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike();

      expect(player.hand.count).toBe(initialHandCount);
    });
  });
});
