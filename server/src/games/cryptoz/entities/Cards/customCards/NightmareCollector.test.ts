import type { Mock } from 'vitest';

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

import { NightmareCollector } from './NightmareCollector';

describe('NightmareCollector', () => {
  let card: NightmareCollector;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new NightmareCollector(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new NightmareCollector();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NIGHTMARE_COLLECTOR);
    expect(card.name).toBe('Кошмарный Сборщик');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new NightmareCollector(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NIGHTMARE_COLLECTOR);
    expect(card.name).toBe('Кошмарный Сборщик');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(4);
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
      strike: 'Выбранный противник показывает все карты на руке. Противник получает урон, равный стоимости самой ценной карты среди открытых',
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
    const mockCard = new MockCard({ room, price: 2 });
    addCardToPlayerHand(mockCard, player);
    room.socketService.emitToPlayers = vi.fn();

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(18);
    expect(activePlayer.hand.count).toBe(0);
    const handCardsEvent = (room.socketService.emitToPlayers as Mock)
      .mock.calls.find(call => call[1] === CryptozShared.EEventTypes.showModalCards);
    expect(handCardsEvent).toBeDefined();
    expect(handCardsEvent?.[0].array).toEqual(room.players.array);
    expect(handCardsEvent?.[2]).toEqual({
      cards: player.hand.array.map(card => card.format()),
      title: `Рука участника ${player.nickname}`,
    });
  });

  it('Разыгрывается с уроном 0', async () => {
    room.socketService.emitToPlayers = vi.fn();

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    const handCardsEvent = (room.socketService.emitToPlayers as Mock)
      .mock.calls.find(call => call[1] === CryptozShared.EEventTypes.showModalCards);
    expect(handCardsEvent).toBeDefined();
    expect(handCardsEvent?.[0].array).toEqual(room.players.array);
    expect(handCardsEvent?.[2]).toEqual({
      cards: player.hand.array.map(card => card.format()),
      title: `Рука участника ${player.nickname}`,
    });
  });

  it('Не наносится урон, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });
});
