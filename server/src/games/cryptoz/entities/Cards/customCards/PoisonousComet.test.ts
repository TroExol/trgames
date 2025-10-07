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
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { PriceModifier } from '@/games/cryptoz/customModifiers/PriceModifier';

import { PoisonousComet } from './PoisonousComet';
import { FortuneSpawn } from './FortuneSpawn';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('PoisonousComet', () => {
  let card: PoisonousComet;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new PoisonousComet(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new PoisonousComet();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.POISONOUS_COMET);
    expect(card.name).toBe('Ядовитая Комета');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new PoisonousComet(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.POISONOUS_COMET);
    expect(card.name).toBe('Ядовитая Комета');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 карту. Разыграй мракобой за каждую купленную или полученную карту в этот ход: нанеси урон противнику, равный цене этой карты',
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

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    room.socketService.selectTarget = vi.fn().mockResolvedValue(player);
    const initialHandCount = activePlayer.hand.count;
    await card.play();
    expect(card.canPlayGeneralHandler()).toBeTruthy();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(initialHandCount);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.health).toBe(20);

    const cardToTake = new MockCard({ room, price: 3 });
    const cards = new CardGroup(ECardGroupType.ANY, [cardToTake]);
    activePlayer.takeCardsToDeck(cards, cards);
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(17);

    player.health = 20;
    const cardToBuy = new MockCard({ room, price: 3 });
    room.market.addCardToBottom(cardToBuy);
    activePlayer.modifiersPrice.addModifier(new PriceModifier('1', price => price - 1));
    activePlayer.addEssenceOnTurn(2);
    activePlayer.buyCard(cardToBuy.type, cardToBuy);
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(18);
  });

  it('Работает с перенаправлением атаки', async () => {
    const cardEvade = new FortuneSpawn(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await card.play();
    expect(activePlayer.arena.count).toBe(1);

    const cardToTake = new MockCard({ room, price: 3 });
    const cards = new CardGroup(ECardGroupType.ANY, [cardToTake]);
    activePlayer.takeCardsToDeck(cards, cards);
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(20);
    expect(activePlayer.health).toBe(17);
  });
});
