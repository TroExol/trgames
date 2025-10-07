import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addAbilityToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { Ability8 } from './Ability8';

describe('Ability8', () => {
  let ability: Ability8;
  let room: Room;
  let activePlayer: Player;
  let card1: MockCard;
  let card2: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability8(room);
    addAbilityToPlayer(ability, activePlayer);
    card1 = new MockCard({ room, price: 3 });
    card2 = new MockCard({ room, price: 5 });
    room.market.addCardToTop(card1);
    room.market.addCardToTop(card2);
  });

  it('Инстанс создается', () => {
    const ability = new Ability8();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(8);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability8(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(8);
    expect(ability.room).toBe(room);
  });

  it('Применяется', () => {
    activePlayer.addEssenceOnTurn(10);
    activePlayer.buyCard(card1.type, card1);
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(6);
  });

  it('Не применяется, если цена больше 4', () => {
    activePlayer.addEssenceOnTurn(10);
    activePlayer.buyCard(card2.type, card2);
    expect(activePlayer.discard.count).toBe(6);
    expect(activePlayer.deck.count).toBe(5);
  });
});
