import type { Mock } from 'vitest';

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
  addCardToPlayerDeck,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { toPlayerVariant } from '@/games/cryptoz/helpers/utils';
import { SoulfireAltar } from '@/games/cryptoz/entities/Cards/customCards/SoulfireAltar';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { Noctullos } from './Noctullos';

describe('Noctullos', () => {
  let card: Noctullos;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new Noctullos(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new Noctullos();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NOCTULLOS);
    expect(card.name).toBe('Ноктуллос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(3);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new Noctullos(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.NOCTULLOS);
    expect(card.name).toBe('Ноктуллос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(3);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Все противники сбрасывают случайную карту и получают урон, равный ее цене',
      other: 'Пока эта карта у тебя, вместо уничтожения карты, передай ее противнику',
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
    expect(card.canPlayGeneralHandler()).toBeTruthy();
    player.hand.clear();
    const cardToDiscard = new SoulfireAltar(room); // Цена 5
    addCardToPlayerHand(cardToDiscard, player);
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(player.health).toBe(15);
    expect(player.hand.count).toBe(0);
    expect(player.discard.count).toBe(1);
    expect(player.discard.getCard(cardToDiscard)).toBe(cardToDiscard);
  });

  it('Разыгрывается с уроном 0', async () => {
    await card.play();
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.health).toBe(20);
    expect(player.health).toBe(20);
    expect(player.hand.count).toBe(4);
    expect(player.discard.count).toBe(1);
  });

  describe('Функционал передачи карт вместо удаления', () => {
    it('Передает карты другому участнику вместо удаления, когда владеет Ноктуллос', async () => {
      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: player.nickname });

      const cardToRemove1 = new SoulfireAltar(room);
      const cardToRemove2 = new SoulfireAltar(room);
      addCardToPlayerHand(cardToRemove1, activePlayer);
      addCardToPlayerHand(cardToRemove2, activePlayer);

      const initialPlayerDiscardCount = player.discard.count;
      const cardsToRemove = new CardGroup(ECardGroupType.ANY, [cardToRemove1, cardToRemove2]);

      activePlayer.removeCards(cardsToRemove, 'hand');

      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.selectCards).toHaveBeenCalledTimes(2);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].cards.array)
        .toEqual(new CardGroup(ECardGroupType.ANY, [cardToRemove2]).array);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].player)
        .toBe(activePlayer);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].variants)
        .toEqual(room.players.getPlayersExceptPlayer(activePlayer).array.map(toPlayerVariant));
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].title)
        .toBe('Передай карту');

      expect((room.socketService.selectCards as Mock).mock.calls[1][0].cards.array)
        .toEqual(new CardGroup(ECardGroupType.ANY, [cardToRemove1]).array);
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].player)
        .toBe(activePlayer);
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].variants)
        .toEqual(room.players.getPlayersExceptPlayer(activePlayer).array.map(toPlayerVariant));
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].title)
        .toBe('Передай карту');

      // Проверяем, что карты переданы другому участнику, а не удалены
      expect(activePlayer.hand.count).toBe(1);
      expect(player.hand.count).toBe(5);
      expect(player.discard.count).toBe(initialPlayerDiscardCount + 2);
      expect(player.discard.getCard(cardToRemove1)).toBe(cardToRemove1);
      expect(player.discard.getCard(cardToRemove2)).toBe(cardToRemove2);
      expect(cardToRemove1.ownerNickname).toBe(player.nickname);
      expect(cardToRemove2.ownerNickname).toBe(player.nickname);
      expect(room.removed.cards.count).toBe(0);
    });

    it('Если карт Ноктуллос несколько, то карты не дублируются при удалении', async () => {
      addCardToPlayerDeck(new Noctullos(room), activePlayer);

      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: player.nickname });

      const cardToRemove1 = new SoulfireAltar(room);
      const cardToRemove2 = new SoulfireAltar(room);
      addCardToPlayerHand(cardToRemove1, activePlayer);
      addCardToPlayerHand(cardToRemove2, activePlayer);

      const initialPlayerDiscardCount = player.discard.count;
      const cardsToRemove = new CardGroup(ECardGroupType.ANY, [cardToRemove1, cardToRemove2]);

      activePlayer.removeCards(cardsToRemove, 'hand');

      await vi.advanceTimersToNextTimerAsync();

      expect(room.socketService.selectCards).toHaveBeenCalledTimes(2);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].cards.array)
        .toEqual(new CardGroup(ECardGroupType.ANY, [cardToRemove2]).array);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].player)
        .toBe(activePlayer);
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].variants)
        .toEqual(room.players.getPlayersExceptPlayer(activePlayer).array.map(toPlayerVariant));
      expect((room.socketService.selectCards as Mock).mock.calls[0][0].title)
        .toBe('Передай карту');

      expect((room.socketService.selectCards as Mock).mock.calls[1][0].cards.array)
        .toEqual(new CardGroup(ECardGroupType.ANY, [cardToRemove1]).array);
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].player)
        .toBe(activePlayer);
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].variants)
        .toEqual(room.players.getPlayersExceptPlayer(activePlayer).array.map(toPlayerVariant));
      expect((room.socketService.selectCards as Mock).mock.calls[1][0].title)
        .toBe('Передай карту');

      // Проверяем, что карты переданы другому участнику, а не удалены
      expect(activePlayer.hand.count).toBe(1);
      expect(player.hand.count).toBe(5);
      expect(player.discard.count).toBe(initialPlayerDiscardCount + 2);
      expect(player.discard.getCard(cardToRemove1)).toBe(cardToRemove1);
      expect(player.discard.getCard(cardToRemove2)).toBe(cardToRemove2);
      expect(cardToRemove1.ownerNickname).toBe(player.nickname);
      expect(cardToRemove2.ownerNickname).toBe(player.nickname);
      expect(room.removed.cards.count).toBe(0);
    });

    it('Удаляет карты обычно, когда не владеет Ноктуллос', () => {
      activePlayer.hand.clear();

      const cardToRemove1 = new SoulfireAltar(room);
      const cardToRemove2 = new SoulfireAltar(room);
      addCardToPlayerHand(cardToRemove1, activePlayer);
      addCardToPlayerHand(cardToRemove2, activePlayer);

      const initialPlayerHandCount = player.hand.count;
      const cardsToRemove = new CardGroup(ECardGroupType.ANY, [cardToRemove1, cardToRemove2]);

      activePlayer.removeCards(cardsToRemove, 'hand');

      // Проверяем, что карты удалены, а не переданы
      expect(activePlayer.hand.count).toBe(0);
      expect(player.hand.count).toBe(initialPlayerHandCount);
      expect(room.removed.cards.count).toBe(2);
      expect(room.removed.cards.getCard(cardToRemove1)).toBe(cardToRemove1);
      expect(room.removed.cards.getCard(cardToRemove2)).toBe(cardToRemove2);
    });

    it('Передает карты из разных зон', async () => {
      room.socketService.selectTarget = vi.fn().mockResolvedValue(player);

      const cardFromHand = new SoulfireAltar(room);
      const cardFromDeck = new SoulfireAltar(room);
      const cardFromDiscard = new SoulfireAltar(room);
      const cardFromSeals = new SoulfireAltar(room);

      addCardToPlayerHand(cardFromHand, activePlayer);
      activePlayer.deck.addCardToTop(cardFromDeck);
      activePlayer.discard.addCardToTop(cardFromDiscard);
      activePlayer.seals.addCardToTop(cardFromSeals);

      const initialPlayerDiscardCount = player.discard.count;

      // Удаляем карты из разных зон
      activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [cardFromHand]), 'hand');
      activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [cardFromDeck]), 'deck');
      activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [cardFromDiscard]), 'discard');
      activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [cardFromSeals]), 'seals');

      await vi.advanceTimersToNextTimerAsync();

      // Проверяем, что все карты переданы другому участнику
      expect(player.hand.count).toBe(5);
      expect(player.discard.count).toBe(initialPlayerDiscardCount + 4);
      expect(player.discard.getCard(cardFromHand)).toBe(cardFromHand);
      expect(player.discard.getCard(cardFromDeck)).toBe(cardFromDeck);
      expect(player.discard.getCard(cardFromDiscard)).toBe(cardFromDiscard);
      expect(player.discard.getCard(cardFromSeals)).toBe(cardFromSeals);
      expect(room.removed.cards.count).toBe(0);
    });

    it('Не передает карты, если нет других участников', () => {
      room.players.removePlayer(player);

      const cardToRemove = new SoulfireAltar(room);
      addCardToPlayerHand(cardToRemove, activePlayer);

      const cardsToRemove = new CardGroup(ECardGroupType.ANY, [cardToRemove]);

      activePlayer.removeCards(cardsToRemove, 'hand');

      // Проверяем, что карты удалены обычно, так как нет других участников
      expect(activePlayer.hand.count).toBe(1);
      expect(room.removed.cards.count).toBe(1);
      expect(room.removed.cards.getCard(cardToRemove)).toBe(cardToRemove);
    });

    it('Передает специальные карты (CURSED_SEAL, DARKNESS_MADNESS)', async () => {
      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: player.nickname });

      const cursedSeal = room.cursedSeals.array.splice(-1)[0];
      const darknessMadness = room.darknessMadness.array.splice(-1)[0];

      addCardToPlayerHand(cursedSeal, activePlayer);
      addCardToPlayerHand(darknessMadness, activePlayer);

      const cardsToRemove = new CardGroup(ECardGroupType.ANY, [cursedSeal, darknessMadness]);

      activePlayer.removeCards(cardsToRemove, 'hand');

      await vi.advanceTimersToNextTimerAsync();

      // Проверяем, что selectTarget был вызван для специальных карт
      expect(room.socketService.selectCards).toHaveBeenCalledTimes(2);
      expect(activePlayer.hand.count).toBe(1);
      expect(room.cursedSeals.count).toBe(15); // Колво уменьшилось на 1
      expect(room.cursedSeals.getCard(cursedSeal)).toBeNull();
      expect(room.darknessMadness.count).toBe(15); // Колво уменьшилось на 1
      expect(room.darknessMadness.getCard(darknessMadness)).toBeNull();
    });
  });
});
