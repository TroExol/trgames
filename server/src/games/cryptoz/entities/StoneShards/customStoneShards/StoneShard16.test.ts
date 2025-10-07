import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { StoneShard16 } from './StoneShard16';
import { Discharge } from '../../Cards/customCards/Discharge';

describe('StoneShard16', () => {
  let stoneShard: StoneShard16;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard16(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard16();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(16);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard16(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(16);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Ты получаешь на 3 урона больше от карты Разряд. Считается печатью');
  });

  it('Всегда можно разыграть', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается успешно', async () => {
    await stoneShard.play(player);
  });

  it('Добавляет модификатор при назначении владельца', () => {
    const initialModifiersCount = activePlayer.modifiersDamageToSelf.count;
    const initialCountSealsModifiersCount = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, activePlayer);

    expect(activePlayer.modifiersDamageToSelf.count).toBe(initialModifiersCount + 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(initialCountSealsModifiersCount + 1);
    expect(activePlayer.countSeals).toBe(1);
    expect(player.countSeals).toBe(0);
  });

  it('Удаляет модификатор при смене владельца', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);
    const modifiersCountWithOwner = activePlayer.modifiersDamageToSelf.count;
    const countSealsModifiersCountWithOwner = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, player);

    expect(activePlayer.modifiersPrice.count).toBe(modifiersCountWithOwner - 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(countSealsModifiersCountWithOwner - 1);
    expect(player.modifiersDamageToSelf.count).toBe(1);
    expect(player.modifiersCountSeals.count).toBe(1);
    expect(player.countSeals).toBe(1);
    expect(activePlayer.countSeals).toBe(0);
  });

  it('Модификатор увеличивает урон от Разряда на 3', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты Разряд
    const dischargeCard = new Discharge(room);

    // Симулируем базовый урон
    const baseDamage = 5;
    const expectedDamage = baseDamage + 3;

    // Применяем модификаторы
    let result = baseDamage;
    activePlayer.modifiersDamageToSelf.array.forEach(modifier => {
      result = modifier.modifier(result, dischargeCard);
    });

    expect(result).toBe(expectedDamage);
  });

  it('Модификатор не влияет на урон от других карт', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок другой карты
    const otherCard = new MockCard({ room, name: 'Другая карта' });

    // Симулируем базовый урон
    const baseDamage = 5;

    // Применяем модификаторы
    let result = baseDamage;
    activePlayer.modifiersDamageToSelf.array.forEach(modifier => {
      result = modifier.modifier(result, otherCard);
    });

    expect(result).toBe(baseDamage);
  });

  it('Модификатор увеличивает количество печатей на 1', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Симулируем базовое количество печатей
    const baseCount = 2;
    const expectedCount = baseCount + 1;

    // Применяем модификаторы
    let result = baseCount;
    activePlayer.modifiersCountSeals.array.forEach(modifier => {
      result = modifier.modifier(result);
    });

    expect(result).toBe(expectedCount);
  });
});
