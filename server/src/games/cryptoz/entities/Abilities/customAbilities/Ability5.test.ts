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

import { Ability5 } from './Ability5';

describe('Ability5', () => {
  let ability: Ability5;
  let room: Room;
  let activePlayer: Player;
  let ritual1: MockCard;
  let ritual2: MockCard;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    ability = new Ability5(room);
    addAbilityToPlayer(ability, activePlayer);
    ritual1 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerHand(ritual1, activePlayer);
    ritual2 = new MockCard({ room, type: CryptozShared.ECardType.RITUAL });
    addCardToPlayerHand(ritual2, activePlayer);
  });

  it('Инстанс создается', () => {
    const ability = new Ability5();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(5);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new Ability5(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(5);
    expect(ability.room).toBe(room);
  });

  it('Применяется и сбрасывает карту', async () => {
    const topDeck = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDeck]),
    });
    await ritual1.play();
    expect(activePlayer.discard.count).toBe(6);
    expect(activePlayer.deck.count).toBe(4);
  });

  it('Применяется и не сбрасывает карту', async () => {
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, []),
    });
    await ritual1.play();
    expect(activePlayer.discard.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    const topDeck = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDeck]),
    });
    await ritual2.play();
    expect(activePlayer.discard.count).toBe(6);
    expect(activePlayer.deck.count).toBe(4);
  });
});
