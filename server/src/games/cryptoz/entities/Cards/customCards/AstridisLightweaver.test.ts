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
import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { AstridisLightweaver } from './AstridisLightweaver';

describe('AstridisLightweaver', () => {
  let card: AstridisLightweaver;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new AstridisLightweaver(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new AstridisLightweaver();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ASTRIDIS_LIGHTWEAVER);
    expect(card.name).toBe('Астридис Светоткач');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции и возьми 1 карту',
      strike: 'Нанеси 10 урона противнику',
    });
  });

  it('Дает 2 эссенции и карту', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    expect(activePlayer.hand.count).toBe(1);
  });

  it('Наносит 10 урона противнику', async () => {
    player.health = 20;
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(10);
  });

  it('Не наносит урон, если укрылся', async () => {
    player.health = 20;
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(20);
  });
});
