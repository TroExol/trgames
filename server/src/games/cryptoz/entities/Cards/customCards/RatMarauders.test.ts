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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { RatMarauders } from './RatMarauders';

describe('RatMarauders', () => {
  let card: RatMarauders;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new RatMarauders(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new RatMarauders();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RAT_MARAUDERS);
    expect(card.name).toBe('Крысиные Мародеры');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new RatMarauders(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RAT_MARAUDERS);
    expect(card.name).toBe('Крысиные Мародеры');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      evade: 'Можешь передать 1 карту с руки или сброса в сброс атакующего',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    await card.play();
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.arena.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается укрытие и передается карта с руки', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
    });

    void card.playEvade({ cardAttack: card, attacker: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.discard.count).toBe(1);
    expect(player.discard.array).toEqual([handCard]);
    expect(player.health).toBe(20);
  });

  it('Разыгрывается укрытие и передается карта из сброса', async () => {
    activePlayer.discard.clear();
    const discardCard = new MockCard({ room });
    addCardToPlayerDiscard(discardCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [discardCard]),
    });

    void card.playEvade({ cardAttack: card, attacker: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.discard.count).toBe(1);
    expect(activePlayer.discard.getCard(card)).toBe(card);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.discard.count).toBe(1);
    expect(player.discard.array).toEqual([discardCard]);
    expect(player.health).toBe(20);
  });

  it('Разыгрывается укрытие и не передается карта', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
      variant: 2,
    });

    await card.playEvade({ cardAttack: card, attacker: player });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(room.removed.cards.count).toBe(0);
    expect(player.discard.count).toBe(0);
    expect(player.health).toBe(20);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
    });

    await card.playEvade({ cardAttack: card });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.discard.count).toBe(0);
    expect(player.health).toBe(20);
  });
});
