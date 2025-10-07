import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { PawOfFate } from './PawOfFate';

describe('PawOfFate', () => {
  let card: PawOfFate;
  let room: Room;
  let activePlayer: Player;
  let enemyPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    enemyPlayer = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    enemyPlayer.discardHand(enemyPlayer.hand);
    card = new PawOfFate(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PAW_OF_FATE);
    expect(card.name).toBe('Лапа судьбы');
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.basePrice).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.baseGloryShards).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 карту и восстанови 2 здоровья',
    });
    // Проверяем isSimple
    expect(card['getDescription'](true)).toEqual({
      general: 'Возьми 1 карту и восстанови 2 здоровья',
    });
  });

  it('Разыгрывает general: добор карты и восстановление 2 здоровья', async () => {
    activePlayer.arena.addCardToTop(card);
    const initialHand = activePlayer.hand.array.length;
    const initialHealth = activePlayer.health;
    await card.playGeneral();
    expect(activePlayer.hand.array.length).toBe(initialHand + 1);
    expect(activePlayer.health).toBe(initialHealth + card.getHeal(2, activePlayer));
  });

  it('Нельзя разыграть strike', async () => {
    await card.playStrike({ canEvade: false });
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });
});
