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
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { StoneShard20 } from './StoneShard20';

describe('StoneShard20', () => {
  let stoneShard: StoneShard20;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard20(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard20();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(20);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard20(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(20);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Плати на 1 больше за нечисть и ритуалы. Считается печатью');
  });

  it('Всегда можно разыграть', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается успешно', async () => {
    await stoneShard.play(player);
  });

  it('Добавляет модификатор при назначении владельца', () => {
    const initialModifiersCount = activePlayer.modifiersPrice.count;
    const initialCountSealsModifiersCount = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, activePlayer);

    expect(activePlayer.modifiersPrice.count).toBe(initialModifiersCount + 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(initialCountSealsModifiersCount + 1);
    expect(activePlayer.countSeals).toBe(1);
    expect(player.countSeals).toBe(0);
  });

  it('Удаляет модификатор при смене владельца', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);
    const modifiersCountWithOwner = activePlayer.modifiersPrice.count;
    const countSealsModifiersCountWithOwner = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, player);

    expect(activePlayer.modifiersPrice.count).toBe(modifiersCountWithOwner - 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(countSealsModifiersCountWithOwner - 1);
    expect(player.modifiersPrice.count).toBe(1);
    expect(player.modifiersCountSeals.count).toBe(1);
    expect(player.countSeals).toBe(1);
    expect(activePlayer.countSeals).toBe(0);
  });

  it('Модификатор увеличивает цену нечисти на 1', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты нечисти
    const wickednessCard = new MockCard({
      room,
      name: 'Нечисть',
      type: CryptozShared.ECardType.WICKEDNESS,
    });

    // Симулируем базовую цену
    const basePrice = 5;
    const expectedPrice = basePrice + 1;

    // Применяем модификаторы
    let result = basePrice;
    activePlayer.modifiersPrice.array.forEach(modifier => {
      result = modifier.modifier(result, wickednessCard);
    });

    expect(result).toBe(expectedPrice);
  });

  it('Модификатор увеличивает цену ритуалов на 1', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты ритуала
    const ritualCard = new MockCard({
      room,
      name: 'Ритуал',
      type: CryptozShared.ECardType.RITUAL,
    });

    // Симулируем базовую цену
    const basePrice = 5;
    const expectedPrice = basePrice + 1;

    // Применяем модификаторы
    let result = basePrice;
    activePlayer.modifiersPrice.array.forEach(modifier => {
      result = modifier.modifier(result, ritualCard);
    });

    expect(result).toBe(expectedPrice);
  });

  it('Модификатор не влияет на цену других карт', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок другой карты
    const otherCard = new MockCard({
      room,
      name: 'Другая карта',
      type: CryptozShared.ECardType.SPARK,
    });

    // Симулируем базовую цену
    const basePrice = 5;

    // Применяем модификаторы
    let result = basePrice;
    activePlayer.modifiersPrice.array.forEach(modifier => {
      result = modifier.modifier(result, otherCard);
    });

    expect(result).toBe(basePrice);
  });
});
