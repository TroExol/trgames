import type { Socket } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import { createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { ChaosM } from './ChaosM';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosM', () => {
  let card: ChaosM;
  let room: Room;
  let activePlayer: Player;
  let thirdPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;

    // Создаем третьего участника
    thirdPlayer = new Player({ nickname: 'thirdPlayer', room, participant: 'player' });
    room.players.addPlayerToBottom(thirdPlayer);
    const thirdPlayerSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(thirdPlayer.nickname, thirdPlayerSocket);

    card = new ChaosM(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosM();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_M);
    expect(card.name).toBe('Хаос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CHAOS);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Можно разыграть general эффект', () => {
    expect(card.canPlayGeneralHandler()).toBe(true);
  });

  it('Участник уничтожает карту без осколков славы', async () => {
    const cardInHand = activePlayer.hand.top;
    const initialHandCount = activePlayer.hand.count;
    const initialRemovedCount = room.removed.cards.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: { top: cardInHand },
      variant: 1,
    });

    await card.play({ tempPlayer: activePlayer });

    expect(activePlayer.hand.count).toBe(initialHandCount - 1);
    expect(room.removed.cards.count).toBe(initialRemovedCount + 1);
  });

  it('Участник уничтожает карту с 2 осколками славы и получает 6 карт', async () => {
    const cardWithGlory = activePlayer.hand.top;
    if (cardWithGlory) {
      vi.spyOn(cardWithGlory, 'getGloryShards').mockReturnValue(2);
    }

    const initialHandCount = activePlayer.hand.count;
    const initialDiscardCount = activePlayer.discard.count;
    const initialDeckCount = room.deck.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: { top: cardWithGlory },
      variant: 1,
    });

    await card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });

    // +6 карт за осколки, -1 уничтоженная = +5 итого
    expect(activePlayer.hand.count).toBe(initialHandCount - 1);
    expect(activePlayer.discard.count).toBe(initialDiscardCount + 6);
    expect(room.deck.count).toBe(initialDeckCount - 6);
  });

  it('Участник отказывается от уничтожения карты', async () => {
    const initialHandCount = activePlayer.hand.count;
    const initialRemovedCount = room.removed.cards.count;

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      variant: 2,
    });

    await card.play({ tempPlayer: activePlayer });

    expect(activePlayer.hand.count).toBe(initialHandCount);
    expect(room.removed.cards.count).toBe(initialRemovedCount);
  });

  it('Участник без карт пропускается', async () => {
    activePlayer.hand.clear();
    activePlayer.discard.clear();

    const initialRemovedCount = room.removed.cards.count;

    await card.play({ tempPlayer: activePlayer, concreteTargets: new PlayerGroup([activePlayer]) });

    expect(activePlayer.hand.count).toBe(0);
    expect(room.removed.cards.count).toBe(initialRemovedCount);
  });

  it('Пустая основная стопка не вызывает ошибок', async () => {
    const cardWithGlory = activePlayer.hand.top;
    if (cardWithGlory) {
      vi.spyOn(cardWithGlory, 'getGloryShards').mockReturnValue(1);
    }

    room.deck.clear();
    const initialHandCount = activePlayer.hand.count;

    room.socketService.selectVariant = vi.fn().mockResolvedValue(1);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: { top: cardWithGlory },
    });

    await card.play({ tempPlayer: activePlayer });

    expect(activePlayer.hand.count).toBe(initialHandCount);
    expect(room.deck.count).toBe(0);
  });
});
