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

import { RedHotBlacksmith } from './RedHotBlacksmith';

describe('RedHotBlacksmith', () => {
  let card: RedHotBlacksmith;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new RedHotBlacksmith(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new RedHotBlacksmith();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RED_HOT_BLACKSMITH);
    expect(card.name).toBe('Раскаленный Кузнец');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new RedHotBlacksmith(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.RED_HOT_BLACKSMITH);
    expect(card.name).toBe('Раскаленный Кузнец');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    await card.play();

    expect(activePlayer.essenceToSpend).toBe(initialEssence + 3);
    expect(activePlayer.playedCards.array).toEqual([card]);
  });

  it('Нельзя разыграть мракобоем', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });
});
