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

import { DreadOneEyedWarrior } from './DreadOneEyedWarrior';

describe('DreadOneEyedWarrior', () => {
  let card: DreadOneEyedWarrior;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new DreadOneEyedWarrior(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new DreadOneEyedWarrior();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DREAD_ONE_EYED_WARRIOR);
    expect(card.name).toBe('Грозный Одноглазый Воитель');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(8);
    expect(card.baseGloryShards).toBe(4);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new DreadOneEyedWarrior(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.DREAD_ONE_EYED_WARRIOR);
    expect(card.name).toBe('Грозный Одноглазый Воитель');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(8);
    expect(card.baseGloryShards).toBe(4);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция. Возьми 1 карту и нанеси по 1 урону всем противникам',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    expect(card.canPlayGeneralHandler()).toBeTruthy();

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.health).toBe(19);
    expect(activePlayer.hand.count).toBe(1);
  });

  it('Разыгрывается хаосом', async () => {
    expect(card.canPlayGeneralHandler()).toBeTruthy();

    void card.play({ isForChaos: true, tempPlayer: activePlayer });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.getCard(card)).toBe(card);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(19);
    expect(activePlayer.health).toBe(19);
    expect(activePlayer.hand.count).toBe(1);
  });
});
