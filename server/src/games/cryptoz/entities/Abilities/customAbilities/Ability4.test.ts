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
} from '@/games/cryptoz/vitest/utils';

import { Ability4 } from './Ability4';

describe('Ability4', () => {
  let ability: Ability4;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability4(room);
    addAbilityToPlayer(ability, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability4();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(4);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability4(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(4);
    expect(ability.room).toBe(room);
  });

  it('Разыгрывается', async () => {
    await ability.play();
    expect(activePlayer.health).toBe(16);
    expect(activePlayer.hand.count).toBe(1);
  });

  it('Не разыгрывается, если не хватает здоровья', async () => {
    activePlayer.health = 3;
    await ability.play();
    expect(activePlayer.health).toBe(3);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Может умереть', async () => {
    activePlayer.health = 4;
    await ability.play();
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(1);
  });
});
