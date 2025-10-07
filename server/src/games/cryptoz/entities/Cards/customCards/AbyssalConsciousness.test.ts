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
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { AbyssalConsciousness } from './AbyssalConsciousness';

describe('AbyssalConsciousness', () => {
  let card: AbyssalConsciousness;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new AbyssalConsciousness(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new AbyssalConsciousness();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ABYSSAL_CONSCIOUSNESS);
    expect(card.name).toBe('Бездонное Сознание');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
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
    const card = new AbyssalConsciousness(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ABYSSAL_CONSCIOUSNESS);
    expect(card.name).toBe('Бездонное Сознание');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
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
      general: '+2 эссенции',
      strike: 'Противник сбрасывает 1 карту стоимостью 5 или больше. Если он укрывается от этого, то получает 5 урона',
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

  it('Разыгрывается и дает эссенции', async () => {
    const initialEssence = activePlayer.essenceToSpend;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Заставляет сбросить карту стоимостью 5 или больше', async () => {
    const expensiveCard = new MockCard({ room, price: 6 });
    addCardToPlayerHand(expensiveCard, player);

    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: { array: [expensiveCard], count: 1 },
      variant: { id: 1, value: 'Сбросить' },
    });

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.hand.getCard(expensiveCard)).toBeNull();
    expect(player.discard.array).toContain(expensiveCard);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Наносит урон при укрытии', async () => {
    const expensiveCard = new MockCard({ room, price: 6 });
    addCardToPlayerHand(expensiveCard, player);

    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.health).toBe(15); // 20 - 5 = 15 (урон за укрытие)
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Не работает, если у цели нет дорогих карт', async () => {
    const cheapCard = new MockCard({ room, price: 3 });
    addCardToPlayerHand(cheapCard, player);

    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.hand.getCard(cheapCard)).toBeDefined(); // Карта не сброшена
    expect(player.health).toBe(20); // Здоровье не изменилось
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Работает с конкретной целью', async () => {
    const expensiveCard = new MockCard({ room, price: 6 });
    addCardToPlayerHand(expensiveCard, player);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: { array: [expensiveCard], count: 1 },
      variant: { id: 1, value: 'Сбросить' },
    });

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.hand.getCard(expensiveCard)).toBeNull();
    expect(player.discard.array).toContain(expensiveCard);
    expect(activePlayer.hand.count).toBe(0);
  });
});
