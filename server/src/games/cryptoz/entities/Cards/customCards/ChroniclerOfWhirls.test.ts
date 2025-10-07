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
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { ChroniclerOfWhirls } from './ChroniclerOfWhirls';

describe('ChroniclerOfWhirls', () => {
  let card: ChroniclerOfWhirls;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    player.discardHand(player.hand);
    card = new ChroniclerOfWhirls(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ChroniclerOfWhirls();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHRONICLER_OF_WHIRLS);
    expect(card.name).toBe('Хроник Вихрей');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ChroniclerOfWhirls(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHRONICLER_OF_WHIRLS);
    expect(card.name).toBe('Хроник Вихрей');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция. Если ты сыграл эту карту первой за ход, сбрось руку и возьми 4 карты',
    });
  });

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печать', async () => {
    await card.playSeal();
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    expect(card.canPlayEvadeHandler()).toBeFalsy();
    await card.playEvade({ cardAttack: card });
  });

  it('Разыгрывается как первая карта в ходу', async () => {
    // Добавляем карты в руку для проверки сброса
    activePlayer.takeCards(3);
    expect(activePlayer.hand.count).toBe(4); // 3 + 1 карта хроника

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(activePlayer.hand.count).toBe(4); // Сбросили руку и взяли 4 карты
  });

  it('Разыгрывается не как первая карта в ходу', async () => {
    // Симулируем, что уже была сыграна карта
    activePlayer.playedCards.addCardToTop(new ChroniclerOfWhirls(room));

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toContain(card);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(activePlayer.hand.count).toBe(0); // Не сбрасывали руку и не брали карты
  });

  it('Разыгрывается для хаоса', async () => {
    void card.play({ isForChaos: true });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([]);
    expect(activePlayer.hand.getCard(card)).not.toBeNull();
    expect(activePlayer.playedCards.array).toEqual([]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
  });
});
