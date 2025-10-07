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
  addCardToPlayerDeck,
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { SoulfireAltar } from './SoulfireAltar';
import { Discharge } from './Discharge';
import { DarknessMadness } from './DarknessMadness';

describe('DarknessMadness', () => {
  let card: DarknessMadness;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new DarknessMadness(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new DarknessMadness();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DARKNESS_MADNESS);
    expect(card.name).toBe('Безумие тьмы');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.DARKNESS_MADNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new DarknessMadness(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DARKNESS_MADNESS);
    expect(card.name).toBe('Безумие тьмы');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.DARKNESS_MADNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Выбери: +2 эссенции или разыграй верхнюю карту из стопки противника. Если это печать, оставь ее у себя, иначе отправь в сброс противника',
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

  it('Разыгрывается с выбором эссенции', async () => {
    room.socketService.selectVariant = vi.fn().mockResolvedValue(1);
    expect(card.canPlayGeneralHandler()).toBeTruthy();
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается с чужой картой', async () => {
    room.socketService.selectVariant = vi.fn().mockResolvedValue(2);
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    const discharge = new Discharge(room);
    addCardToPlayerDeck(discharge, player);
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([discharge, card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(19);
    expect(player.deck.count).toBe(5);
    expect(player.deck.getCard(discharge)).toBeNull();
    expect(player.discard.count).toBe(1);
    expect(player.discard.getCard(discharge)).toBe(discharge);
    expect(discharge.owner).toBe(player);
  });

  it('Разыгрывается с кражей печати', async () => {
    room.socketService.selectVariant = vi.fn().mockResolvedValue(2);
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    const soulfireAltar = new SoulfireAltar(room);
    addCardToPlayerDeck(soulfireAltar, player);
    expect(card.canPlayGeneralHandler()).toBeTruthy();
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.seals.array).toEqual([soulfireAltar]);
    expect(activePlayer.playedCards.array).toEqual([soulfireAltar, card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.deck.count).toBe(5);
    expect(player.deck.getCard(soulfireAltar)).toBeNull();
    expect(player.discard.count).toBe(0);
    expect(soulfireAltar.owner).toBe(activePlayer);
  });

  it('Разыгрывается и замешивает личную стопку', async () => {
    room.socketService.selectVariant = vi.fn().mockResolvedValue(2);
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    const discharge = new Discharge(room);
    player.deck.clear();
    addCardToPlayerDiscard(discharge, player);
    expect(card.canPlayGeneralHandler()).toBeTruthy();

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([discharge, card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(19);
    expect(player.deck.count).toBe(0);
    expect(player.discard.count).toBe(1);
    expect(player.discard.getCard(discharge)).toBe(discharge);
    expect(discharge.owner).toBe(player);
  });

  it('Разыгрывается при отсутствии карт', async () => {
    room.socketService.selectVariant = vi.fn().mockResolvedValue(2);
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    player.deck.clear();
    expect(card.canPlayGeneralHandler()).toBeTruthy();
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.deck.count).toBe(0);
    expect(player.discard.count).toBe(0);
  });
});
