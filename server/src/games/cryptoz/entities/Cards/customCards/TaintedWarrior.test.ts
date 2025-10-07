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

import { ToxicBonechewer } from './ToxicBonechewer';
import { TaintedWarrior } from './TaintedWarrior';
import { CursedSeal } from './CursedSeal';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('TaintedWarrior', () => {
  let card: TaintedWarrior;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    player.discardHand(player.hand);
    card = new TaintedWarrior(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new TaintedWarrior();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.TAINTED_WARRIOR);
    expect(card.name).toBe('Оскверненный воин');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(10);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new TaintedWarrior(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.TAINTED_WARRIOR);
    expect(card.name).toBe('Оскверненный воин');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(10);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции и возьми 1 карту. Можешь уничтожить Проклятую печать на руке и в сбросе',
      totalStrike: 'Каждый участник получает Проклятую печать за каждое существо на рынке',
    });
  });

  it('canPlayGeneralHandler возвращает true', () => {
    expect(card.canPlayGeneralHandler()).toBeTruthy();
  });

  it('canPlayStrikeHandler возвращает false', () => {
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('canPlaySealHandler возвращает false', () => {
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('canPlayTotalDarknessStrikeHandler возвращает true', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeTruthy();
  });

  it('canPlayEvadeHandler возвращает false', () => {
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Основная способность', () => {
    it('Дает +2 эссенции и берет карту без проклятых печатей', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      const initialHandCount = activePlayer.hand.count;

      room.socketService.selectCards = vi.fn();

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 1); // -1 разыгранная карта +1 взятая
      expect(activePlayer.arena.count).toBe(1);
      expect(room.socketService.selectCards).not.toHaveBeenCalled();
    });

    it('Уничтожает проклятые печати из руки', async () => {
      // Добавляем проклятые печати в руку
      const cursedSeal1 = new CursedSeal(room);
      const cursedSeal2 = new CursedSeal(room);
      cursedSeal1.changeOwner(activePlayer.nickname);
      cursedSeal2.changeOwner(activePlayer.nickname);
      addCardToPlayerHand(cursedSeal1, activePlayer);
      addCardToPlayerHand(cursedSeal2, activePlayer);

      const initialEssence = activePlayer.essenceToSpend;
      const initialHandCount = activePlayer.hand.count;

      // Мокаем выбор карт из руки (выбираем обе проклятые печати)
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [cursedSeal1, cursedSeal2]),
        variant: 1,
      });

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(activePlayer.hand.count).toBe(initialHandCount - 3 + 1); // -1 карта -2 печати +1 взятая карта
      expect(activePlayer.hand.getCard(cursedSeal1)).toBeNull();
      expect(activePlayer.hand.getCard(cursedSeal2)).toBeNull();
      expect(activePlayer.arena.count).toBe(1);
      expect(room.socketService.selectCards).toHaveBeenCalledOnce();
    });

    it('Уничтожает проклятые печати из сброса', async () => {
      // Добавляем проклятые печати в сброс
      const cursedSeal1 = new CursedSeal(room);
      cursedSeal1.changeOwner(activePlayer.nickname);
      activePlayer.discard.addCardToTop(cursedSeal1);

      const initialEssence = activePlayer.essenceToSpend;
      const initialHandCount = activePlayer.hand.count;
      const initialDiscardCount = activePlayer.discard.count;

      // Мокаем выбор карт из сброса
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [cursedSeal1]),
        variant: 1,
      });

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 1); // -1 карта +1 взятая карта
      expect(activePlayer.discard.count).toBe(initialDiscardCount - 1);
      expect(activePlayer.discard.getCard(cursedSeal1)).toBeNull();
      expect(activePlayer.arena.count).toBe(1);
      expect(room.socketService.selectCards).toHaveBeenCalledOnce();
    });

    it('Оставляет проклятые печати если участник выбрал "Оставить"', async () => {
      // Добавляем проклятые печати в руку
      const cursedSeal1 = new CursedSeal(room);
      cursedSeal1.changeOwner(activePlayer.nickname);
      addCardToPlayerHand(cursedSeal1, activePlayer);

      const initialHandCount = activePlayer.hand.count;

      // Мокаем выбор "Оставить"
      room.socketService.selectCards = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [cursedSeal1]),
        variant: 2,
      });

      await card.play();

      expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 1); // -1 карта +1 взятая карта
      expect(activePlayer.hand.getCard(cursedSeal1)).not.toBeNull();
      expect(room.socketService.selectCards).toHaveBeenCalledOnce();
    });

    it('Уничтожает проклятые печати из руки и сброса по отдельности', async () => {
      // Добавляем проклятые печати в руку и сброс
      const handSeal = new CursedSeal(room);
      const discardSeal = new CursedSeal(room);
      handSeal.changeOwner(activePlayer.nickname);
      discardSeal.changeOwner(activePlayer.nickname);
      addCardToPlayerHand(handSeal, activePlayer);
      activePlayer.discard.addCardToTop(discardSeal);

      const initialEssence = activePlayer.essenceToSpend;
      const initialHandCount = activePlayer.hand.count;
      const initialDiscardCount = activePlayer.discard.count;

      // Мокаем два вызова selectCards
      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [handSeal]),
          variant: 1,
        })
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [discardSeal]),
          variant: 1,
        });

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
      expect(activePlayer.hand.count).toBe(initialHandCount - 2 + 1); // -1 карта -1 печать +1 взятая карта
      expect(activePlayer.discard.count).toBe(initialDiscardCount - 1);
      expect(activePlayer.hand.getCard(handSeal)).toBeNull();
      expect(activePlayer.discard.getCard(discardSeal)).toBeNull();
      expect(activePlayer.arena.count).toBe(1);
      expect(room.socketService.selectCards).toHaveBeenCalledTimes(2);
    });
  });

  describe('Тотальный мракобой', () => {
    it('Дает проклятые печати всем участникам по количеству существ на рынке', async () => {
      // Добавляем существ на рынок
      const creature1 = new ToxicBonechewer(room);
      const creature2 = new ToxicBonechewer(room);
      room.market.clear();
      room.market.addCardToTop(creature1);
      room.market.addCardToTop(creature2);

      const players = room.players.array;
      const initialDiscardCounts = players.map(player => player.discard.count);
      const initialCursedSealsCount = room.cursedSeals.count;

      // Мокаем укрытие (никто не укрывается)
      players.forEach(player => {
        player.tryEvade = vi.fn().mockResolvedValue(false);
      });

      await card.playTotalDarknessStrike();

      // Каждый участник должен получить 2 проклятые печати (по количеству существ)
      players.forEach((player, index) => {
        expect(player.discard.count).toBe(initialDiscardCounts[index] + 2);
      });

      // Проверяем что проклятые печати взяты из общей кучи
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount - (players.length * 2));
    });

    it('Не дает карты если нет существ на рынке', async () => {
      // Очищаем рынок от существ
      room.market.clear();

      const players = room.players.array;
      const initialDiscardCounts = players.map(player => player.discard.count);
      const initialCursedSealsCount = room.cursedSeals.count;

      // Мокаем укрытие (никто не укрывается)
      players.forEach(player => {
        player.tryEvade = vi.fn().mockResolvedValue(false);
      });

      await card.playTotalDarknessStrike();

      // Количество карт не должно измениться
      players.forEach((player, index) => {
        expect(player.discard.count).toBe(initialDiscardCounts[index]);
      });

      // Проклятые печати не должны тратиться
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount);
    });

    it('Позволяет укрыться от эффекта', async () => {
      // Добавляем одно существо на рынок
      const creature = new ToxicBonechewer(room);
      room.market.clear();
      room.market.addCardToTop(creature);

      // Первый участник укрывается, второй нет
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDiscard = player.discard.count;
      const initialCursedSealsCount = room.cursedSeals.count;

      await card.playTotalDarknessStrike();

      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard);
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1);
      expect(player.discard.count).toBe(initialPlayerDiscard + 1);
    });

    it('Учитывает только существ на рынке, не другие типы карт', async () => {
      // Добавляем разные типы карт на рынок
      const creature = new ToxicBonechewer(room);
      const cursedSeal = new CursedSeal(room);
      room.market.clear();
      room.market.addCardToTop(creature);
      room.market.addCardToTop(cursedSeal);

      const players = room.players.array;
      const initialDiscardCounts = players.map(player => player.discard.count);
      const initialCursedSealsCount = room.cursedSeals.count;

      // Мокаем укрытие (никто не укрывается)
      players.forEach(player => {
        player.tryEvade = vi.fn().mockResolvedValue(false);
      });

      await card.playTotalDarknessStrike();

      // Каждый участник должен получить только 1 проклятую печать (по количеству существ)
      players.forEach((player, index) => {
        expect(player.discard.count).toBe(initialDiscardCounts[index] + 1);
      });

      // Проверяем что потрачена правильная сумма проклятых печатей
      expect(room.cursedSeals.count).toBe(initialCursedSealsCount - players.length);
    });
  });
});
