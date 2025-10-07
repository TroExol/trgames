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
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { DreadOneEyedWarrior } from '@/games/cryptoz/entities/Cards/customCards/DreadOneEyedWarrior';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { MrShadowcat } from './MrShadowcat';

describe('MrShadowcat', () => {
  let card: MrShadowcat;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new MrShadowcat(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new MrShadowcat();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MR_SHADOWCAT);
    expect(card.name).toBe('Мистер Мракокот');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new MrShadowcat(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MR_SHADOWCAT);
    expect(card.name).toBe('Мистер Мракокот');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 2 карты, сбрось 1 карту. Восстанови здоровье, равное стоимости сброшенной карты. Если твое здоровье 25, сбрось любой свой осколок Философского камня',
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
    const stoneShard = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
    const handCard = new DreadOneEyedWarrior(room);
    addCardToPlayerHand(handCard, activePlayer);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
    });
    activePlayer.health = 1;
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.deck.count).toBe(3);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(9);
    expect(activePlayer.stoneShards.count).toBe(1);
  });

  it('Разыгрывается при здоровье 25', async () => {
    const stoneShard = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
    const handCard = new DreadOneEyedWarrior(room);
    addCardToPlayerHand(handCard, activePlayer);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
    });
    room.socketService.selectStoneShards = vi.fn().mockResolvedValue({
      stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard]),
    });
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.deck.count).toBe(3);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(25);
    expect(activePlayer.stoneShards.count).toBe(0);
  });

  it('Разыгрывается при отсутствии карт', async () => {
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY),
    });
    room.socketService.selectStoneShards = vi.fn().mockResolvedValue({
      stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY),
    });
    activePlayer.deck.clear();
    activePlayer.discard.clear();
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.deck.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.stoneShards.count).toBe(0);
  });
});
