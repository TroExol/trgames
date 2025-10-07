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
  addStoneShardToPlayer,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { AbstractStoneShard } from '@/games/cryptoz/entities/StoneShards/AbstractStoneShard/AbstractStoneShard';

import { TouchOfMist } from './TouchOfMist';

// Мокаем осколок философского камня
class MockStoneShard extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 1, room });
  }
  protected getDescription() { return ''; }
  public canPlayHandler() { return false; }
  protected playHandler() { return Promise.resolve(false); }
  protected onChangeOwner() {}
}

describe('TouchOfMist', () => {
  let card: TouchOfMist;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new TouchOfMist(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new TouchOfMist();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.TOUCH_OF_MIST);
    expect(card.name).toBe('Прикосновение Тумана');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(3);
    expect(card.baseEssence).toBe(5);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+5 эссенции. -1 эссенция за каждый твой осколок Философского камня',
    });
  });

  it('Дает 5 эссенции, если нет осколков', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 5);
  });

  it('Дает 3 эссенции, если 2 осколка', async () => {
    // Добавляем 2 осколка философского камня
    addStoneShardToPlayer(new MockStoneShard(room), activePlayer);
    addStoneShardToPlayer(new MockStoneShard(room), activePlayer);
    const initialEssence = activePlayer.essenceToSpend;
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 3);
  });

  it('Отрицательная эссенция, если осколков 5 или больше', async () => {
    for (let i = 0; i < 6; i++) {
      addStoneShardToPlayer(new MockStoneShard(room), activePlayer);
    }
    const initialEssence = activePlayer.essenceToSpend;
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.essenceToSpend).toBe(initialEssence - 1);
  });
});
