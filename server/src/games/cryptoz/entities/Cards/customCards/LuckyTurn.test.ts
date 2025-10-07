import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
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

import { LuckyTurn } from './LuckyTurn';
import { Discharge } from './Discharge';

describe('LuckyTurn', () => {
  let card: LuckyTurn;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new LuckyTurn(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new LuckyTurn();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.LUCKY_TURN);
    expect(card.name).toBe('Счастливый Поворот');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new LuckyTurn(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.LUCKY_TURN);
    expect(card.name).toBe('Счастливый Поворот');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 карту',
      evade: 'Возьми 1 карту и восстанови 3 здоровья',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialHandCount = activePlayer.hand.count;
    await card.play();

    expect(activePlayer.hand.count).toBe(initialHandCount);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });

  it('Разыгрывается укрытием', async () => {
    activePlayer.hand.clear();
    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new LuckyTurn(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await cardAttack.play({ concreteTarget: player });
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(1);

    expect(player.health).toBe(23);
    expect(player.hand.count).toBe(6);
    expect(player.hand.getCard(cardEvade)).toBeNull();
    expect(activePlayer.health).toBe(20);
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
});
