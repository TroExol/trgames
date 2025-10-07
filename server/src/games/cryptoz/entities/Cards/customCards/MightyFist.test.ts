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

import { MightyFist } from './MightyFist';

describe('MightyFist', () => {
  let card: MightyFist;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new MightyFist(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new MightyFist();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIGHTY_FIST);
    expect(card.name).toBe('Мощный кулак');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new MightyFist(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIGHTY_FIST);
    expect(card.name).toBe('Мощный кулак');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 карту',
      strike: 'Нанеси 6 урона противнику слева или справа',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialHandCount = activePlayer.hand.count;

    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.hand.count).toBe(initialHandCount);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(14);
    expect(player.hand.count).toBe(5);
    expect(activePlayer.health).toBe(20);
  });

  it('Разыгрывается мракобой', async () => {
    activePlayer.hand.clear();
    const cardAttack = new MightyFist(room);
    addCardToPlayerHand(cardAttack, activePlayer);

    void cardAttack.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(0);

    expect(player.health).toBe(14);
    expect(player.hand.count).toBe(5);
    expect(activePlayer.health).toBe(20);
  });

  it('Не наносится урон, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(1);
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
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
