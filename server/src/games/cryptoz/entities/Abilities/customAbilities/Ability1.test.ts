import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { Ability1 } from './Ability1';

describe('Ability1', () => {
  let ability: Ability1;
  let room: Room;
  let activePlayer: Player;
  let artifact1: MockCard;
  let artifact2: MockCard;
  let artifact3: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability1(room);
    addAbilityToPlayer(ability, activePlayer);
    artifact1 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerHand(artifact1, activePlayer);
    artifact2 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerHand(artifact2, activePlayer);
    artifact3 = new MockCard({ room, type: CryptozShared.ECardType.ARTIFACT });
    addCardToPlayerHand(artifact3, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability1();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(1);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability1(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(1);
    expect(ability.room).toBe(room);
  });

  it('Применяется и перемещает карту', async () => {
    const topDiscard = activePlayer.discard.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDiscard]),
    });
    await artifact1.play();
    await artifact2.play();
    await artifact3.play();
    expect(activePlayer.discard.count).toBe(4);
    expect(activePlayer.deck.count).toBe(6);
  });

  it('Применяется и не перемещает карту', async () => {
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, []),
    });
    await artifact1.play();
    await artifact2.play();
    const topDiscard = activePlayer.discard.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDiscard]),
    });
    await artifact3.play();
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
  });
});
