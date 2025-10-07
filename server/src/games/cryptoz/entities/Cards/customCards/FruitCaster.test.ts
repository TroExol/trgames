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
import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { FruitCaster } from './FruitCaster';
import { DarknessShard } from './DarknessShard';

describe('FruitCaster', () => {
  let card: FruitCaster;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new FruitCaster(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new FruitCaster();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FRUIT_CASTER);
    expect(card.name).toBe('Плодовый заклинатель');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const mocks = createMockRoomWithPlayers();
    const card = new FruitCaster(mocks.room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FRUIT_CASTER);
    expect(card.name).toBe('Плодовый заклинатель');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(mocks.room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции. Восстанови 1 здоровье за каждую твою искру',
      totalStrike: 'Каждый участник получает 5 урона и получает Проклятую печать',
    });
  });

  it('Можно разыграть тотальный мракобой', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBe(true);
  });

  it('Нелья разыграть тотальный мракобой, если нет проклятой печати', () => {
    room.cursedSeals.clear();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBe(false);
  });

  it('Нельзя разыграть укрытие', () => {
    expect(card.canPlayEvadeHandler()).toBe(false);
  });

  it('Разыгрывается и добавляет эссенции', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается и лечит за искры', async () => {
    activePlayer.deck.clear();
    activePlayer.discard.clear();

    const spark1 = new DarknessShard(room);
    const spark2 = new DarknessShard(room);
    const spark3 = new DarknessShard(room);

    activePlayer.discard.addCardToTop(spark1);
    activePlayer.discard.addCardToTop(spark2);
    activePlayer.discard.addCardToTop(spark3);

    const initialHealth = activePlayer.health;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.health).toBe(initialHealth + 3);
  });

  it('Не лечит если нет искр', async () => {
    activePlayer.deck.clear();
    activePlayer.discard.clear();
    const initialHealth = activePlayer.health;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.health).toBe(initialHealth);
  });

  it('Тотальный мракобой наносит урон, дает проклятую печать всем участникам', async () => {
    const initialHealth1 = activePlayer.health;
    const initialHealth2 = player.health;
    const initialCursedSeals = room.cursedSeals.count;

    activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
    player.tryEvade = vi.fn().mockResolvedValue(false);

    await card.playTotalDarknessStrike();

    expect(activePlayer.health).toBe(initialHealth1 - 5);
    expect(player.health).toBe(initialHealth2 - 5);
    expect(activePlayer.discard.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).not.toBeNull();
    expect(player.discard.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).not.toBeNull();
    expect(room.cursedSeals.count).toBe(initialCursedSeals - 2);
  });
  it('Тотальный мракобой наносит урон, дает проклятую печать конкретному участнику', async () => {
    const initialHealth1 = activePlayer.health;
    const initialHealth2 = player.health;
    const initialCursedSeals = room.cursedSeals.count;

    activePlayer.tryEvade = vi.fn().mockResolvedValue(false);

    await card.playTotalDarknessStrike({ target: activePlayer });

    expect(activePlayer.health).toBe(initialHealth1 - 5);
    expect(player.health).toBe(initialHealth2);
    expect(activePlayer.discard.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).not.toBeNull();
    expect(player.discard.getCardByType(CryptozShared.ECardType.CURSED_SEAL)).toBeNull();
    expect(room.cursedSeals.count).toBe(initialCursedSeals - 1);
  });
});
