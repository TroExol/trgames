import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
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

import { DungeonOfWailingShadows } from './DungeonOfWailingShadows';

describe('DungeonOfWailingShadows', () => {
  let card: DungeonOfWailingShadows;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new DungeonOfWailingShadows(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new DungeonOfWailingShadows();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DUNGEON_OF_WAILING_SHADOWS);
    expect(card.name).toBe('Подземелье Стонущих Теней');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new DungeonOfWailingShadows(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DUNGEON_OF_WAILING_SHADOWS);
    expect(card.name).toBe('Подземелье Стонущих Теней');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      seal: 'При первом розыгрыше существа за ход возьми 1 карту',
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
    const creature1 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    const creature2 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    addCardToPlayerHand(creature1, activePlayer);
    addCardToPlayerHand(creature2, activePlayer);

    await card.play();
    await creature1.play();
    await creature2.play();

    expect(activePlayer.arena.count).toBe(2);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.array).toEqual([card, creature1, creature2]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });
});
