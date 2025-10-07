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
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { CollectorOfSilentWaves } from './CollectorOfSilentWaves';

describe('CollectorOfSilentWaves', () => {
  let card: CollectorOfSilentWaves;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new CollectorOfSilentWaves(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new CollectorOfSilentWaves();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.COLLECTOR_OF_SILENT_WAVES);
    expect(card.name).toBe('Собиратель Безмолвных Волн');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new CollectorOfSilentWaves(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.COLLECTOR_OF_SILENT_WAVES);
    expect(card.name).toBe('Собиратель Безмолвных Волн');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 ритуал из сброса. Если ритуалов нет, +2 эссенции',
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

  it('Разыгрывается без ритуалов', async () => {
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается с ритуалом', async () => {
    const ritual = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerDiscard(ritual, activePlayer);

    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.hand.getCard(ritual)).toBe(ritual);
    expect(activePlayer.discard.getCard(ritual)).toBeNull();
  });

  it('Разыгрывается с несколькими ритуалами', async () => {
    const ritual1 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    const ritual2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerDiscard(ritual1, activePlayer);
    addCardToPlayerDiscard(ritual2, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [ritual2]),
    });

    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.hand.getCard(ritual2)).toBe(ritual2);
    expect(activePlayer.discard.getCard(ritual1)).toBe(ritual1);
  });
});
