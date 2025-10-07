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

import { PrinceOfDecay } from './PrinceOfDecay';

describe('PrinceOfDecay', () => {
  let card: PrinceOfDecay;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    activePlayer.discard.clear();
    player = mocks.player;
    player.discardHand(player.hand);
    player.discard.clear();
    card = new PrinceOfDecay(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new PrinceOfDecay();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PRINCE_OF_DECAY);
    expect(card.name).toBe('Принц Тления');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new PrinceOfDecay(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PRINCE_OF_DECAY);
    expect(card.name).toBe('Принц Тления');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Каждый противник сбрасывает 1 карту',
    });
  });

  it('Можно разыграть мракобой', () => {
    expect(card.canPlayStrikeHandler()).toBeTruthy();
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

  it('Разыгрывается основная способность', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается мракобой', async () => {
    // Добавляем карты в руки противников
    player.takeCards(3);
    expect(player.hand.count).toBe(3);

    // Мокаем выбор карты для сброса
    const cardToDiscard = player.hand.array[0];
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: player.hand.getCards(cardToDiscard),
      variant: 1,
    });

    activePlayer.arena.addCardToTop(card);

    void card.playStrike();
    await vi.advanceTimersToNextTimerAsync();

    // Проверяем, что противник сбросил одну карту
    expect(player.hand.count).toBe(2);
    expect(player.discard.count).toBe(1);
    expect(player.discard.getCard(cardToDiscard)).toBe(cardToDiscard);
  });

  it('Мракобой работает с пустыми руками', async () => {
    player.discardHand(player.hand);
    expect(player.hand.count).toBe(0);

    activePlayer.arena.addCardToTop(card);

    void card.playStrike();
    await vi.advanceTimersToNextTimerAsync();

    // Проверяем, что ничего не изменилось
    expect(player.hand.count).toBe(0);
    expect(player.discard.count).toBe(0);
  });

  it('Мракобой работает когда противник отменяет выбор', async () => {
    // Добавляем карты в руки противников
    player.takeCards(3);
    expect(player.hand.count).toBe(3);

    // Мокаем отмену выбора карты
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: player.hand.getCardsFromTop(0),
      variant: 1,
    });

    activePlayer.arena.addCardToTop(card);

    void card.playStrike();
    await vi.advanceTimersToNextTimerAsync();

    // Проверяем, что противник не сбросил карты
    expect(player.hand.count).toBe(3);
    expect(player.discard.count).toBe(0);
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

  it('Мракобой для хаоса не работает', async () => {
    player.takeCards(3);
    expect(player.hand.count).toBe(3);

    void card.playStrike({ isForChaos: true });
    await vi.advanceTimersToNextTimerAsync();

    // Проверяем, что противник не сбросил карты
    expect(player.hand.count).toBe(3);
    expect(player.discard.count).toBe(0);
  });
});
