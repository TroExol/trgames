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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { DarknessShard } from './DarknessShard';
import { ChaosN } from './ChaosN';
import { PlayerGroup } from '../../Players/PlayerGroup';

describe('ChaosN', () => {
  let card: ChaosN;
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
    card = new ChaosN(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosN();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_N);
    expect(card.name).toBe('Хаос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CHAOS);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ChaosN(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_N);
    expect(card.name).toBe('Хаос');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CHAOS);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      strike: 'Все кладут Осколки мрака из сброса на верх своей стопки',
    });
  });

  it('canPlayStrikeHandler возвращает true', () => {
    expect(card.canPlayStrikeHandler()).toBeTruthy();
  });

  it('canPlayGeneralHandler возвращает false', () => {
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('canPlaySealHandler возвращает false', () => {
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('canPlayTotalDarknessStrikeHandler возвращает false', () => {
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('canPlayEvadeHandler возвращает false', () => {
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  describe('Хаос эффект', () => {
    it('Перемещает Осколки мрака из сброса на верх стопки', async () => {
      activePlayer.discard.clear();
      activePlayer.deck.clear();
      activePlayer.hand.clear();
      player.discard.clear();
      player.deck.clear();
      player.hand.clear();

      // Создаем Осколки мрака
      const darknessShard1 = new DarknessShard(room);
      const darknessShard2 = new DarknessShard(room);
      const darknessShard3 = new DarknessShard(room);

      // Добавляем их в сброс участников
      activePlayer.discard.addCardToTop(darknessShard1);
      activePlayer.discard.addCardToTop(darknessShard2);
      player.discard.addCardToTop(darknessShard3);

      // Добавляем обычные карты в сброс для проверки, что они не перемещаются
      const regularCard1 = new MockCard({ room });
      const regularCard2 = new MockCard({ room });
      activePlayer.discard.addCardToTop(regularCard1);
      player.discard.addCardToTop(regularCard2);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDiscard = player.discard.count;
      const initialActivePlayerDeck = activePlayer.deck.count;
      const initialPlayerDeck = player.deck.count;

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer });

      // Проверяем, что Осколки мрака переместились на верх стопки
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck + 2);
      expect(player.deck.count).toBe(initialPlayerDeck + 1);

      // Проверяем, что Осколки мрака удалены из сброса
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard - 2);
      expect(player.discard.count).toBe(initialPlayerDiscard - 1);

      // Проверяем, что обычные карты остались в сбросе
      expect(activePlayer.discard.array).toContain(regularCard1);
      expect(player.discard.array).toContain(regularCard2);

      // Проверяем, что Осколки мрака находятся на верху стопки
      expect(activePlayer.deck.array[activePlayer.deck.count - 1]).toBe(darknessShard1);
      expect(activePlayer.deck.array[activePlayer.deck.count - 2]).toBe(darknessShard2);
      expect(player.deck.array[player.deck.count - 1]).toBe(darknessShard3);
    });

    it('Работает с пустым сбросом', async () => {
      activePlayer.discard.clear();
      player.discard.clear();

      const initialActivePlayerDeck = activePlayer.deck.count;
      const initialPlayerDeck = player.deck.count;

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck);
      expect(player.deck.count).toBe(initialPlayerDeck);
    });

    it('Работает когда в сбросе нет Осколков мрака', async () => {
      activePlayer.discard.clear();
      player.discard.clear();

      // Добавляем только обычные карты в сброс
      const regularCard1 = new MockCard({ room });
      const regularCard2 = new MockCard({ room });
      activePlayer.discard.addCardToTop(regularCard1);
      player.discard.addCardToTop(regularCard2);

      const initialActivePlayerDiscard = activePlayer.discard.count;
      const initialPlayerDiscard = player.discard.count;
      const initialActivePlayerDeck = activePlayer.deck.count;
      const initialPlayerDeck = player.deck.count;

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что ничего не изменилось
      expect(activePlayer.discard.count).toBe(initialActivePlayerDiscard);
      expect(player.discard.count).toBe(initialPlayerDiscard);
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck);
      expect(player.deck.count).toBe(initialPlayerDeck);
    });

    it('Участники могут укрываться от эффекта', async () => {
      player.discard.clear();
      // Добавляем Осколки мрака в сброс
      const darknessShard1 = new DarknessShard(room);
      const darknessShard2 = new DarknessShard(room);
      activePlayer.discard.addCardToTop(darknessShard1);
      player.discard.addCardToTop(darknessShard2);

      const initialActivePlayerDeck = activePlayer.deck.count;
      const initialPlayerDeck = player.deck.count;

      // Мокаем укрытие: activePlayer укрывается, player нет
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(activePlayer, 'takeCardsToDeck');
      vi.spyOn(player, 'takeCardsToDeck');

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // activePlayer укрылся - эффект не применился
      expect(activePlayer.tryEvade).toHaveBeenCalled();
      expect(activePlayer.takeCardsToDeck).not.toHaveBeenCalled();
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck);

      // player не укрылся - эффект применился
      expect(player.tryEvade).toHaveBeenCalled();
      expect(player.takeCardsToDeck).toHaveBeenCalled();
      expect(player.deck.count).toBe(initialPlayerDeck + 1);
    });

    it('Работает с конкретными целями', async () => {
      activePlayer.discard.clear();
      player.discard.clear();

      // Добавляем Осколки мрака в сброс
      const darknessShard1 = new DarknessShard(room);
      const darknessShard2 = new DarknessShard(room);
      activePlayer.discard.addCardToTop(darknessShard1);
      player.discard.addCardToTop(darknessShard2);

      const initialActivePlayerDeck = activePlayer.deck.count;
      const initialPlayerDeck = player.deck.count;

      // Мокаем укрытие - участники не укрываются
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);

      // Применяем только к activePlayer
      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer]),
        canEvade: true,
      });

      // Проверяем, что только у activePlayer карты переместились
      expect(activePlayer.deck.count).toBe(initialActivePlayerDeck + 1);
      expect(player.deck.count).toBe(initialPlayerDeck);

      expect(activePlayer.discard.count).toBe(0);
      expect(player.discard.count).toBe(1);
    });
  });
});
