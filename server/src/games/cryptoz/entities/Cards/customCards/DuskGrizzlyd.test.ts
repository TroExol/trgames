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

import { DuskGrizzlyd } from './DuskGrizzlyd';

describe('DuskGrizzlyd', () => {
  let card: DuskGrizzlyd;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new DuskGrizzlyd(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new DuskGrizzlyd();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DUSK_GRIZZLYD);
    expect(card.name).toBe('Сумеречный Гризлид');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new DuskGrizzlyd(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DUSK_GRIZZLYD);
    expect(card.name).toBe('Сумеречный Гризлид');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции. Восстанови 2 здоровья',
      strike: 'Нанеси 5 урона каждому противнику с меньшим здоровьем, чем у тебя',
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

  it('Разыгрывается и дает эссенции и здоровье', async () => {
    const initialHealth = activePlayer.health;
    const initialEssence = activePlayer.essenceToSpend;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    expect(activePlayer.health).toBe(initialHealth + 2);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Наносит урон противникам с меньшим здоровьем', async () => {
    // Устанавливаем здоровье активного участника больше, чем у противника
    activePlayer.health = 15;
    player.health = 10;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(5); // 10 - 5 = 5
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Не наносит урон, если у противника больше здоровья', async () => {
    // Устанавливаем здоровье активного участника меньше, чем у противника
    activePlayer.health = 10;
    player.health = 15;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(15); // Здоровье не изменилось
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Не наносит урон, если укрылся', async () => {
    activePlayer.health = 15;
    player.health = 10;
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(10); // Здоровье не изменилось из-за укрытия
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Работает с несколькими противниками', async () => {
    // Добавляем третьего участника
    const thirdPlayer = room.players.array[2];
    if (thirdPlayer) {
      activePlayer.health = 15;
      player.health = 10;
      thirdPlayer.health = 8;

      void card.play();
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.arena.array).toEqual([card]);
      expect(activePlayer.hand.getCard(card)).toBeNull();
      expect(activePlayer.playedCards.array).toEqual([card]);
      expect(activePlayer.essenceToSpend).toBe(2);
      expect(player.health).toBe(5); // 10 - 5 = 5
      expect(thirdPlayer.health).toBe(3); // 8 - 5 = 3
      expect(activePlayer.hand.count).toBe(0);
    }
  });
});
