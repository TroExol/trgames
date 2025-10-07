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

import { CastleOfEnigmaticDesires } from './CastleOfEnigmaticDesires';

describe('CastleOfEnigmaticDesires', () => {
  let card: CastleOfEnigmaticDesires;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new CastleOfEnigmaticDesires(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new CastleOfEnigmaticDesires();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CASTLE_OF_ENIGMATIC_DESIRES);
    expect(card.name).toBe('Замок Таинственных Желаний');
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
    const card = new CastleOfEnigmaticDesires(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CASTLE_OF_ENIGMATIC_DESIRES);
    expect(card.name).toBe('Замок Таинственных Желаний');
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
      seal: 'При первом розыгрыше ритуала за ход возьми 1 карту',
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
    const ritual1 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    const ritual2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerHand(ritual1, activePlayer);
    addCardToPlayerHand(ritual2, activePlayer);

    await card.play();
    await ritual1.play();
    await ritual2.play();

    expect(activePlayer.arena.count).toBe(2);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.array).toEqual([card, ritual1, ritual2]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });
});
