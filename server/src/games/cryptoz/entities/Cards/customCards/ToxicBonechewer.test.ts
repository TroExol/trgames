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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { ToxicBonechewer } from './ToxicBonechewer';

describe('ToxicBonechewer', () => {
  let card: ToxicBonechewer;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new ToxicBonechewer(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ToxicBonechewer();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.TOXIC_BONECHEWER);
    expect(card.name).toBe('Токсичный Костогрыз');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ToxicBonechewer(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.TOXIC_BONECHEWER);
    expect(card.name).toBe('Токсичный Костогрыз');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция. Можешь уничтожить верхнюю карту стопки',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    const topDeck = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDeck]),
    });
    const playing = card.play();
    await vi.advanceTimersToNextTimerAsync();
    await playing;
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.deck.getCard(topDeck)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(room.removed.cards.getCard(topDeck)).toBe(topDeck);
  });

  it('Разыгрывается без удаления', async () => {
    const topDeck = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, []),
      variant: 2,
    });
    const playing = card.play();
    await vi.advanceTimersToNextTimerAsync();
    await playing;
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.deck.getCard(topDeck)).toBe(topDeck);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(room.removed.cards.count).toBe(0);
  });
});
