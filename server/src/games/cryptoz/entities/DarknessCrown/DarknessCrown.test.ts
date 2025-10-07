import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { DarknessCrown } from './DarknessCrown';

describe('DarknessCrown', () => {
  let darknessCrown: DarknessCrown;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    darknessCrown = new DarknessCrown(room);
    darknessCrown.changeOwner(activePlayer.nickname);
  });

  it('Инстанс создается', () => {
    const darknessCrown = new DarknessCrown();
    expect(darknessCrown).toBeDefined();
    expect(darknessCrown.name).toBe('Корона Мрака');
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const darknessCrown = new DarknessCrown(room);
    expect(darknessCrown).toBeDefined();
    expect(darknessCrown.name).toBe('Корона Мрака');
    expect(darknessCrown.room).toBe(room);
  });

  it('Разыгрывается', async () => {
    const topHandCard = activePlayer.hand.top!;
    const topDeckCard = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topHandCard]),
    });
    await darknessCrown.play();
    expect(activePlayer.discard.count).toBe(1);
    expect(activePlayer.discard.getCard(topHandCard)).toBe(topHandCard);
    expect(activePlayer.hand.getCard(topDeckCard)).toBe(topDeckCard);
    expect(activePlayer.hand.count).toBe(5);
  });

  it('Считается печатью', () => {
    expect(activePlayer.countSeals).toBe(1);
  });

  it('Форматирует корректно', () => {
    expect(darknessCrown.format()).toEqual({
      isPlaying: false,
      name: 'Корона Мрака',
      description: 'В конце хода возьми на 1 карту больше и сбрось 1 карту. Считается печатью',
    });
  });

  it('Меняет владельца', () => {
    expect(darknessCrown.owner).toBe(activePlayer);
    expect(activePlayer.countSeals).toBe(1);
    expect(player.countSeals).toBe(0);
    darknessCrown.changeOwner(player.nickname);
    expect(darknessCrown.owner).toBe(player);
    expect(activePlayer.countSeals).toBe(0);
    expect(player.countSeals).toBe(1);
  });

  it('Разыгрывается в конце хода', async () => {
    room.darknessCrown.changeOwner(activePlayer.nickname);
    const topDeckCard = activePlayer.deck.top!;
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [topDeckCard]),
    });
    await room.endTurn(player);
    await Promise.resolve();
    expect(activePlayer.discard.count).toBe(1);
    expect(activePlayer.discard.getCard(topDeckCard)).toBe(topDeckCard);
    expect(activePlayer.deck.count).toBe(4);
    expect(activePlayer.hand.count).toBe(5);
  });
});
