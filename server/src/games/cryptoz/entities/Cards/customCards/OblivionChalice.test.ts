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
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { OblivionChalice } from './OblivionChalice';

describe('OblivionChalice', () => {
  let card: OblivionChalice;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new OblivionChalice(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new OblivionChalice();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.OBLIVION_CHALICE);
    expect(card.name).toBe('Чаша Забвения');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new OblivionChalice(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.OBLIVION_CHALICE);
    expect(card.name).toBe('Чаша Забвения');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции',
      evade: 'Возьми 1 карту и нанеси 5 урона атакующему',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    await card.play();
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.arena.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(3);
  });

  it('Разыгрывается укрытие', async () => {
    await card.playEvade({ cardAttack: card, attacker: player });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(15);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    await card.playEvade({ cardAttack: card });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(20);
  });
});
