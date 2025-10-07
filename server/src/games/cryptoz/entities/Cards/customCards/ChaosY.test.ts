import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { CursedSeal } from './CursedSeal';
import { ChaosY } from './ChaosY';

describe('ChaosY', () => {
  let card: ChaosY;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let thirdPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;

    // Создаем третьего участника для более интересных тестов
    thirdPlayer = new Player({ nickname: 'thirdPlayer', room, participant: 'player' });
    room.players.addPlayerToBottom(thirdPlayer);

    card = new ChaosY(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosY();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Y);
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
    const card = new ChaosY(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_Y);
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
      strike: 'Все берут Проклятую печать и кладут ее на верх стопки',
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
    it('Все участники берут проклятую печать и кладут на верх стопки', async () => {
      // Создаем проклятые печати
      const cursedSeal1 = new CursedSeal(room);
      const cursedSeal2 = new CursedSeal(room);
      const cursedSeal3 = new CursedSeal(room);

      // Добавляем печати в комнату
      room.cursedSeals.clear();
      room.cursedSeals.addCardToBottom(cursedSeal1);
      room.cursedSeals.addCardToBottom(cursedSeal2);
      room.cursedSeals.addCardToBottom(cursedSeal3);

      // Очищаем стопки участников
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что печати перемещены в стопки участников
      expect(activePlayer.deck.top).toBe(cursedSeal1);
      expect(player.deck.top).toBe(cursedSeal2);
      expect(thirdPlayer.deck.top).toBe(cursedSeal3);

      // Проверяем, что печати удалены из комнаты
      expect(room.cursedSeals.count).toBe(0);
    });

    it('Участники могут укрываться от эффекта', async () => {
      // Создаем проклятую печать
      const cursedSeal = new CursedSeal(room);

      // Добавляем печать в комнату
      room.cursedSeals.clear();
      room.cursedSeals.addCardToBottom(cursedSeal);

      // Очищаем стопки участников
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      // activePlayer укрывается, остальные нет
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что activePlayer не получил печать
      expect(activePlayer.deck.count).toBe(0);

      // Проверяем, что остальные участники получили печати
      expect(player.deck.top).toBe(cursedSeal);
      expect(thirdPlayer.deck.count).toBe(0); // Нет больше печатей в комнате
    });

    it('Работает с пустыми проклятыми печатями', async () => {
      // Очищаем проклятые печати
      room.cursedSeals.clear();

      // Очищаем стопки участников
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что никто не получил печати
      expect(activePlayer.deck.count).toBe(0);
      expect(player.deck.count).toBe(0);
      expect(thirdPlayer.deck.count).toBe(0);
    });

    it('Работает с конкретными целями', async () => {
      // Создаем проклятые печати
      const cursedSeal1 = new CursedSeal(room);
      const cursedSeal2 = new CursedSeal(room);

      // Добавляем печати в комнату
      room.cursedSeals.clear();
      room.cursedSeals.addCardToBottom(cursedSeal1);
      room.cursedSeals.addCardToBottom(cursedSeal2);

      // Очищаем стопки участников
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({
        tempPlayer: activePlayer,
        concreteTargets: new PlayerGroup([activePlayer, thirdPlayer]),
        canEvade: true,
      });

      // Проверяем, что только выбранные участники получили печати
      expect(activePlayer.deck.top).toBe(cursedSeal1);
      expect(player.deck.count).toBe(0); // Не в целях
      expect(thirdPlayer.deck.top).toBe(cursedSeal2);
    });

    it('Обрабатывает случай, когда печатей меньше чем участников', async () => {
      // Создаем только одну проклятую печать
      const cursedSeal = new CursedSeal(room);

      // Добавляем печать в комнату
      room.cursedSeals.clear();
      room.cursedSeals.addCardToBottom(cursedSeal);

      // Очищаем стопки участников
      activePlayer.deck.clear();
      player.deck.clear();
      thirdPlayer.deck.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(player, 'tryEvade').mockResolvedValue(false);
      vi.spyOn(thirdPlayer, 'tryEvade').mockResolvedValue(false);

      await card.play({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что только первый участник получил печать
      expect(activePlayer.deck.top).toBe(cursedSeal);
      expect(player.deck.count).toBe(0);
      expect(thirdPlayer.deck.count).toBe(0);

      // Проверяем, что печать удалена из комнаты
      expect(room.cursedSeals.count).toBe(0);
    });
  });
});
