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
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { Ability2 } from './Ability2';

describe('Ability2', () => {
  let ability: Ability2;
  let room: Room;
  let activePlayer: Player;
  let creature1: MockCard;
  let creature2: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability2(room);
    addAbilityToPlayer(ability, activePlayer);
    creature1 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE, gloryShards: 3 });
    addCardToPlayerHand(creature1, activePlayer);
    creature2 = new MockCard({ room, type: CryptozShared.ECardType.CREATURE, gloryShards: 3 });
    addCardToPlayerHand(creature2, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability2();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(2);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability2(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(2);
    expect(ability.room).toBe(room);
  });

  it('Применяется и хилит', async () => {
    await creature1.play();
    expect(activePlayer.health).toBe(23);
    await creature2.play();
    expect(activePlayer.health).toBe(25);
  });
});
