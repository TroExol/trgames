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
} from '@/games/cryptoz/vitest/utils';

import { BottomlessVoid } from './BottomlessVoid';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('BottomlessVoid', () => {
  let card: BottomlessVoid;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new BottomlessVoid(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new BottomlessVoid();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BOTTOMLESS_VOID);
    expect(card.name).toBe('Бездонная пустота');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new BottomlessVoid(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BOTTOMLESS_VOID);
    expect(card.name).toBe('Бездонная пустота');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
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
      strike: 'Каждый противник показывает верхнюю карту своей стопки, сбрось любые из них',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialEssenceToSpend = activePlayer.essenceToSpend;
    const topCard = player.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      variant: 1,
    });
    const emitToPlayers = vi.fn();
    room.socketService.emitToPlayers = emitToPlayers;
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.essenceToSpend).toBe(initialEssenceToSpend + 2);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.deck.count).toBe(4);
    expect(player.discard.count).toBe(1);
    expect(player.deck.getCard(topCard)).toBeNull();
    expect(player.discard.getCard(topCard)).toBe(topCard);
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(2);
    const showCardEmit = emitToPlayers.mock.calls
      .find(call => call[1] === CryptozShared.EEventTypes.showModalCards)!;
    expect(showCardEmit[0].nicknames).toEqual(room.playersAndViewers.getPlayersExceptPlayer(activePlayer).nicknames);
    expect(showCardEmit[1]).toBe(CryptozShared.EEventTypes.showModalCards);
    expect(showCardEmit[2]).toEqual({
      cards: [topCard.format()],
      cardsSubtitle: { [topCard.readableId]: player.nickname },
      title: 'Верхняя карта стопки участников',
    });
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });
});
