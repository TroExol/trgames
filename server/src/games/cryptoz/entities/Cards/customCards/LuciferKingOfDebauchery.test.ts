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
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';

import { LuciferKingOfDebauchery } from './LuciferKingOfDebauchery';
import { Discharge } from './Discharge';

describe('LuciferKingOfDebauchery', () => {
  let card: LuciferKingOfDebauchery;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new LuciferKingOfDebauchery(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new LuciferKingOfDebauchery();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.LUCIFER_KING_OF_DEBAUCHERY);
    expect(card.name).toBe('Люцифер, Король Разврата');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new LuciferKingOfDebauchery(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.LUCIFER_KING_OF_DEBAUCHERY);
    expect(card.name).toBe('Люцифер, Король Разврата');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции за каждый твой осколок Философского камня',
      evade: 'Возьми 1 карту и перенаправь мракобой в атакующего. Атакующий получает 4 урона дополнительно',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    const stoneShard1 = new StoneShard1(room);
    const stoneShard2 = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard1, activePlayer);
    addStoneShardToPlayer(stoneShard2, activePlayer);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(4);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается без камней', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается укрытие', async () => {
    activePlayer.hand.clear();
    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new LuciferKingOfDebauchery(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await cardAttack.play({ concreteTarget: player });
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(1);

    expect(player.health).toBe(20);
    expect(player.hand.count).toBe(6);
    expect(player.hand.getCard(cardEvade)).toBeNull();
    expect(activePlayer.health).toBe(15);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const cardAttack = new Discharge(room);
    const cardEvade = new LuciferKingOfDebauchery(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await cardAttack.play({ tempPlayer: activePlayer, concreteTarget: player, isForChaos: true });
    expect(activePlayer.playedCards.count).toBe(0);

    expect(player.health).toBe(20);
    expect(player.hand.count).toBe(6);
    expect(player.hand.getCard(cardEvade)).toBeNull();
    expect(activePlayer.health).toBe(20);
  });
});
