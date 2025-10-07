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
import { MockCard } from '@/games/cryptoz/vitest/utils';
import {
  addAbilityToPlayer,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { Ability7 } from './Ability7';

describe('Ability7', () => {
  let ability: Ability7;
  let room: Room;
  let activePlayer: Player;
  let wickedness1: MockCard;
  let wickedness2: MockCard;
  let wickedness3: MockCard;
  let creature1: MockCard;
  let creature2: MockCard;
  let creature3: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability7(room);
    addAbilityToPlayer(ability, activePlayer);
    wickedness1 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    addCardToPlayerHand(wickedness1, activePlayer);
    wickedness2 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    addCardToPlayerHand(wickedness2, activePlayer);
    wickedness3 = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    addCardToPlayerHand(wickedness3, activePlayer);
    creature1 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    addCardToPlayerHand(creature1, activePlayer);
    creature2 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    addCardToPlayerHand(creature2, activePlayer);
    creature3 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    addCardToPlayerHand(creature3, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability7();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(7);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability7(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(7);
    expect(ability.room).toBe(room);
  });

  it('Применяется', async () => {
    expect(activePlayer.essenceToSpend).toBe(0);
    await wickedness1.play();
    expect(activePlayer.essenceToSpend).toBe(0);
    await wickedness2.play();
    expect(activePlayer.essenceToSpend).toBe(2);
    await wickedness3.play();
    expect(activePlayer.essenceToSpend).toBe(2);

    await creature1.play();
    expect(activePlayer.essenceToSpend).toBe(2);
    await creature2.play();
    expect(activePlayer.essenceToSpend).toBe(4);
    await creature3.play();
    expect(activePlayer.essenceToSpend).toBe(4);
  });
});
