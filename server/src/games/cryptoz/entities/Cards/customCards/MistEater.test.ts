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

import { MistEater } from './MistEater';

describe('MistEater', () => {
  let card: MistEater;
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
    card = new MistEater(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new MistEater();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIST_EATER);
    expect(card.name).toBe('Пожиратель Тумана');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new MistEater(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIST_EATER);
    expect(card.name).toBe('Пожиратель Тумана');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
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
      general: 'Возьми или уничтожь верхнюю карту стопки',
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

  it('Разыгрывается и участник берет карту', async () => {
    const topCard = activePlayer.deck.top!;
    expect(topCard).toBeDefined();

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: activePlayer.deck.getCardsFromTop(1),
      variant: 1,
    });

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.getCard(topCard)).toBe(topCard);
    expect(activePlayer.deck.getCard(topCard)).toBeNull();
  });

  it('Разыгрывается и участник уничтожает карту', async () => {
    const topCard = activePlayer.deck.top!;
    expect(topCard).toBeDefined();

    // Мокаем выбор "Уничтожить карту"
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: activePlayer.deck.getCardsFromTop(1),
      variant: 2,
    });

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.getCard(topCard)).toBeNull();
    expect(activePlayer.deck.getCard(topCard)).toBeNull();
    expect(room.removed.cards.getCard(topCard)).toBe(topCard);
  });

  it('Разыгрывается с пустой стопкой', async () => {
    // Очищаем стопку
    activePlayer.deck.clear();
    activePlayer.discard.clear();
    expect(activePlayer.deck.count).toBe(0);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.deck.count).toBe(0);
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
