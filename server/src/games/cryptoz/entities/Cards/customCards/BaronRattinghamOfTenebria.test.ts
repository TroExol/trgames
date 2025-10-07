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
  addCardToPlayerArena,
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { Discharge } from './Discharge';
import { BaronRattinghamOfTenebria } from './BaronRattinghamOfTenebria';

describe('BaronRattinghamOfTenebria', () => {
  let card: BaronRattinghamOfTenebria;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new BaronRattinghamOfTenebria(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new BaronRattinghamOfTenebria();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BARON_RATTINGHAM_OF_TENEBRIA);
    expect(card.name).toBe('Барон Крыссингем из Тенебрия');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new BaronRattinghamOfTenebria(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BARON_RATTINGHAM_OF_TENEBRIA);
    expect(card.name).toBe('Барон Крыссингем из Тенебрия');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Каждый противник получает 2 урона за каждое существо на арене и в твоем сбросе',
      evade: 'Возьми 1 карту и перенаправь мракобой в атакующего',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    const creature1 = new MockCard({
      room,
      type: CryptozShared.ECardType.CREATURE,
    });
    const creature2 = new MockCard({
      room,
      type: CryptozShared.ECardType.CREATURE,
    });
    addCardToPlayerDiscard(creature1, activePlayer);
    addCardToPlayerArena(creature2, activePlayer);
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([creature2, card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(16);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается без существ', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Не наносится урон, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    void card.play({ concreteDamage: 4 });
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается укрытие', async () => {
    activePlayer.hand.clear();
    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new BaronRattinghamOfTenebria(room);
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
    expect(activePlayer.health).toBe(19);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const cardAttack = new Discharge(room);
    const cardEvade = new BaronRattinghamOfTenebria(room);
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
