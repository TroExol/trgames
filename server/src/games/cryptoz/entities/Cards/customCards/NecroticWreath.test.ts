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

import { NecroticWreath } from './NecroticWreath';

describe('NecroticWreath', () => {
  let card: NecroticWreath;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new NecroticWreath(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new NecroticWreath();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NECROTIC_WREATH);
    expect(card.name).toBe('Некротический венок');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(5);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new NecroticWreath(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NECROTIC_WREATH);
    expect(card.name).toBe('Некротический венок');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(5);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+5 эссенции',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialEssenceToSpend = activePlayer.essenceToSpend;
    await card.play();

    expect(activePlayer.essenceToSpend).toBe(initialEssenceToSpend + 5);
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

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });
});
