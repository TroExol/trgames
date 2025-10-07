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

import { Ability6 } from './Ability6';

describe('Ability6', () => {
  let ability: Ability6;
  let room: Room;
  let activePlayer: Player;
  let creature: MockCard;
  let wickedness: MockCard;
  let starter: MockCard;
  let ritual: MockCard;
  let artifact: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability6(room);
    addAbilityToPlayer(ability, activePlayer);
    creature = new MockCard({ room, type: CryptozShared.ECardType.CREATURE });
    addCardToPlayerHand(creature, activePlayer);
    wickedness = new MockCard({ room, type: CryptozShared.ECardType.WICKEDNESS });
    addCardToPlayerHand(wickedness, activePlayer);
    starter = new MockCard({ room, type: CryptozShared.ECardType.SPARK });
    addCardToPlayerHand(starter, activePlayer);
    ritual = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerHand(ritual, activePlayer);
    artifact = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerHand(artifact, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability6();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(6);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability6(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(6);
    expect(ability.room).toBe(room);
  });

  it('Применяется', async () => {
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.essenceToSpend).toBe(0);
    await creature.play();
    await wickedness.play();
    await starter.play();
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.essenceToSpend).toBe(0);
    await ritual.play();
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.essenceToSpend).toBe(1);
    await artifact.play();
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(1);
  });
});
