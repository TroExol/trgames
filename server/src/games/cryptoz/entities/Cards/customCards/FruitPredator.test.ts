import {
  beforeEach,
  describe,
  expect,
  vi,
} from 'vitest';
import { it } from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { FruitPredator } from './FruitPredator';

describe('FruitPredator', () => {
  let card: FruitPredator;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new FruitPredator(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new FruitPredator();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FRUIT_PREDATOR);
    expect(card.name).toBe('Плодовый Хищник');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new FruitPredator(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FRUIT_PREDATOR);
    expect(card.name).toBe('Плодовый Хищник');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Каждый противник получает Проклятую печать. За каждого укрывшегося от этого мракобоя, ты восстанавливаешь 4 здоровья',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.hand.count).toBe(0);
    expect(player.health).toBe(20);
    expect(player.discard.count).toBe(1);
    expect(player.discard.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).not.toBeNull();
  });

  it('Разыгрывается без печатей', async () => {
    room.cursedSeals.clear();
    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(player.discard.count).toBe(0);
  });

  it('Хилит, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(24);
    expect(activePlayer.hand.count).toBe(0);
    expect(player.discard.count).toBe(0);
  });
});
