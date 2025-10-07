import {
  beforeEach,
  describe,
  expect,
  vi,
} from 'vitest';
import { it } from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { BloodyRift } from './BloodyRift';

describe('BloodyRift', () => {
  let card: BloodyRift;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new BloodyRift(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new BloodyRift();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BLOODY_RIFT);
    expect(card.name).toBe('Кровавый Разлом');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new BloodyRift(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BLOODY_RIFT);
    expect(card.name).toBe('Кровавый Разлом');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Нанеси 5 урона противнику',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(15);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Не наносится урон, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });
});
