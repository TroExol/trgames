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

import { StoneShard18 } from './StoneShard18';

describe('StoneShard18', () => {
  let stoneShard: StoneShard18;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard18(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard18();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(18);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard18(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(18);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Плати на 1 больше за предвестников и Безумие тьмы. Считается печатью');
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

  it('Модификатор увеличивает цену Предвестников на 1', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты Предвестник
    const harbingerCard = new MockCard({
      room,
      name: 'Предвестник',
      type: CryptozShared.ECardType.HARBINGER,
    });

    // Симулируем базовую цену
    const basePrice = 5;
    const expectedPrice = basePrice + 1;

    // Применяем модификаторы
    let result = basePrice;
    activePlayer.modifiersPrice.array.forEach(modifier => {
      result = modifier.modifier(result, harbingerCard);
    });

    expect(result).toBe(expectedPrice);
  });

  it('Модификатор увеличивает цену Безумия тьмы на 1', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты Безумие тьмы
    const darknessMadnessCard = new MockCard({
      room,
      name: 'Безумие тьмы',
      id: CryptozShared.ECardId.DARKNESS_MADNESS,
    });

    // Симулируем базовую цену
    const basePrice = 5;
    const expectedPrice = basePrice + 1;

    // Применяем модификаторы
    let result = basePrice;
    activePlayer.modifiersPrice.array.forEach(modifier => {
      result = modifier.modifier(result, darknessMadnessCard);
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
