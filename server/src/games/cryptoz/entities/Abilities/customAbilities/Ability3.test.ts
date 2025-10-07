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
  addAbilityToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { Ability3 } from './Ability3';

describe('Ability3', () => {
  let ability: Ability3;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let wickedness1: MockCard;
  let wickedness2: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    ability = new Ability3(room);
    addAbilityToPlayer(ability, activePlayer);
    wickedness1 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    wickedness2 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    room.market.addCardToTop(wickedness1);
    room.market.addCardToTop(wickedness2);
  });

  it('Инстанс создается', () => {
    const ability = new Ability3();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(3);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability3(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(3);
    expect(ability.room).toBe(room);
  });

  it('Применяется', async () => {
    activePlayer.addEssenceOnTurn(10);
    activePlayer.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [wickedness1]), room.market);
    activePlayer.buyCard(wickedness2.type, wickedness2);
    expect(activePlayer.discard.count).toBe(7);
    expect(activePlayer.deck.count).toBe(5);
    await room.endTurn(player);
    expect(activePlayer.hand.count).toBe(7);
  });

  it('Не применяется, если нет используемых нечистей', async () => {
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    await room.endTurn(player);
    expect(activePlayer.hand.count).toBe(5);
  });
});
