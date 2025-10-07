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
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';

import { CatacombsOfDarkness } from './CatacombsOfDarkness';

describe('CatacombsOfDarkness', () => {
  let card: CatacombsOfDarkness;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new CatacombsOfDarkness(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new CatacombsOfDarkness();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CATACOMBS_OF_DARKNESS);
    expect(card.name).toBe('Катакомбы Мрака');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new CatacombsOfDarkness(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CATACOMBS_OF_DARKNESS);
    expect(card.name).toBe('Катакомбы Мрака');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      seal: 'Мракобои наносят в 2 раза больше урона. Если убил противника, сбрось эту карту',
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
    const attackCard = new MockCard({ room });
    attackCard.canPlayGeneralHandler = () => true;
    attackCard.playGeneral = function () {
      this.owner?.attack(player, this.getDamage(2, this.owner, player));
      return Promise.resolve();
    };
    addCardToPlayerHand(attackCard, activePlayer);

    await card.play();
    await attackCard.play();

    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(player.health).toBe(16);
    expect(activePlayer.playedCards.array).toEqual([card, attackCard]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });

  it('Разыгрывается и сбрасывается, если убивает', async () => {
    const attackCard = new MockCard({ room });
    attackCard.canPlayGeneralHandler = () => true;
    attackCard.playGeneral = function () {
      this.owner?.attack(player, this.getDamage(10, this.owner, player));
      return Promise.resolve();
    };
    addCardToPlayerHand(attackCard, activePlayer);
    const stoneShard = new StoneShard1(room);
    room.stoneShards.clear();
    room.stoneShards.addStoneShardToBottom(stoneShard);

    await card.play();
    await attackCard.play();

    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.seals.count).toBe(0);
    expect(activePlayer.discard.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(player.health).toBe(20);
    expect(player.stoneShards.count).toBe(1);
    expect(activePlayer.playedCards.array).toEqual([card, attackCard]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });
});
