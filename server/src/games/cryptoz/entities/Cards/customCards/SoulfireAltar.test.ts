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

import { SoulfireAltar } from './SoulfireAltar';

describe('SoulfireAltar', () => {
  let card: SoulfireAltar;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new SoulfireAltar(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SoulfireAltar();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SOULFIRE_ALTAR);
    expect(card.name).toBe('Алтарь пламени душ');
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
    const card = new SoulfireAltar(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SOULFIRE_ALTAR);
    expect(card.name).toBe('Алтарь пламени душ');
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
      seal: 'При первом розыгрыше нечисти за ход возьми 1 карту',
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
    const wickedness1 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    const wickedness2 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    addCardToPlayerHand(wickedness1, activePlayer);
    addCardToPlayerHand(wickedness2, activePlayer);

    await card.play();
    await wickedness1.play();
    await wickedness2.play();

    expect(activePlayer.arena.count).toBe(2);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.array).toEqual([card, wickedness1, wickedness2]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });
});
