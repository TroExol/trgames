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

import { SpectralGrasp } from './SpectralGrasp';

describe('SpectralGrasp', () => {
  let card: SpectralGrasp;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new SpectralGrasp(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SpectralGrasp();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SPECTRAL_GRASP);
    expect(card.name).toBe('Призрачный Захват');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(2);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SpectralGrasp(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SPECTRAL_GRASP);
    expect(card.name).toBe('Призрачный Захват');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(2);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция. Следующая купленная или полученная карта уйдет на верх твоей стопки',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается и переносит при покупке', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(5);
    activePlayer.addEssenceOnTurn(5);
    activePlayer.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(6);
    expect(activePlayer.deck.top?.type).toBe(CryptozShared.ECardType.DARKNESS_MADNESS);
    activePlayer.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
    expect(activePlayer.discard.count).toBe(6);
    expect(activePlayer.deck.count).toBe(6);
    expect(activePlayer.discard.top?.type).toBe(CryptozShared.ECardType.DARKNESS_MADNESS);
  });

  it('Разыгрывается и переносит при получении', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(5);
    activePlayer.takeCardsToDiscard(1, room.deck);
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(6);
    activePlayer.takeCardsToDiscard(1, room.deck);
    expect(activePlayer.discard.count).toBe(6);
    expect(activePlayer.deck.count).toBe(6);
  });
});
