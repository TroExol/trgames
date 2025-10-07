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

import { ArtifactsOfFortune } from './ArtifactsOfFortune';

describe('ArtifactsOfFortune', () => {
  let card: ArtifactsOfFortune;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new ArtifactsOfFortune(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ArtifactsOfFortune();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ARTIFACTS_OF_FORTUNE);
    expect(card.name).toBe('Артефакты Судьбы');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ArtifactsOfFortune(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ARTIFACTS_OF_FORTUNE);
    expect(card.name).toBe('Артефакты Судьбы');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
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
      general: 'Возьми 1 артефакт из сброса. Если артефактов нет, +2 эссенции',
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

  it('Разыгрывается без артефактов', async () => {
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается с артефактом', async () => {
    const artifact = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerDiscard(artifact, activePlayer);

    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.hand.getCard(artifact)).toBe(artifact);
    expect(activePlayer.discard.getCard(artifact)).toBeNull();
  });

  it('Разыгрывается с артефактами', async () => {
    const artifact1 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    const artifact2 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerDiscard(artifact1, activePlayer);
    addCardToPlayerDiscard(artifact2, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [artifact2]),
    });

    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.hand.getCard(artifact2)).toBe(artifact2);
    expect(activePlayer.discard.getCard(artifact1)).toBe(artifact1);
  });
});
