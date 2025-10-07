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

import { StoneShard17 } from './StoneShard17';

describe('StoneShard17', () => {
  let stoneShard: StoneShard17;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    stoneShard = new StoneShard17(room);
  });

  it('Инстанс создается', () => {
    const stoneShard = new StoneShard17();
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(17);
    expect(stoneShard.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const stoneShard = new StoneShard17(room);
    expect(stoneShard).toBeDefined();
    expect(stoneShard.uuid).toBeDefined();
    expect(stoneShard.id).toBe(17);
    expect(stoneShard.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(stoneShard.format().description).toBe('Ты не можешь укрыться от мракобоя Хаоса. Считается печатью');
  });

  it('Всегда можно разыграть', () => {
    expect(stoneShard.canPlayHandler()).toBeTruthy();
  });

  it('Разыгрывается успешно', async () => {
    await stoneShard.play(player);
  });

  it('Добавляет модификатор при назначении владельца', () => {
    const initialModifiersCount = activePlayer.modifiersCanEvade.count;
    const initialCountSealsModifiersCount = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, activePlayer);

    expect(activePlayer.modifiersCanEvade.count).toBe(initialModifiersCount + 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(initialCountSealsModifiersCount + 1);
    expect(activePlayer.countSeals).toBe(1);
    expect(player.countSeals).toBe(0);
  });

  it('Удаляет модификатор при смене владельца', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);
    const modifiersCountWithOwner = activePlayer.modifiersCanEvade.count;
    const countSealsModifiersCountWithOwner = activePlayer.modifiersCountSeals.count;
    addStoneShardToPlayer(stoneShard, player);

    expect(activePlayer.modifiersCanEvade.count).toBe(modifiersCountWithOwner - 1);
    expect(activePlayer.modifiersCountSeals.count).toBe(countSealsModifiersCountWithOwner - 1);
    expect(player.modifiersCanEvade.count).toBe(1);
    expect(player.modifiersCountSeals.count).toBe(1);
    expect(player.countSeals).toBe(1);
    expect(activePlayer.countSeals).toBe(0);
  });

  it('Модификатор запрещает укрытие от Хаоса', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок карты Хаос
    const chaosCard = new MockCard({
      room,
      name: 'Хаос',
      type: CryptozShared.ECardType.CHAOS,
    });

    // Симулируем базовое значение возможности укрытия
    const baseCanEvade = true;
    const expectedCanEvade = false;

    // Применяем модификаторы
    let result = baseCanEvade;
    activePlayer.modifiersCanEvade.array.forEach(modifier => {
      result = modifier.modifier(result, chaosCard);
    });

    expect(result).toBe(expectedCanEvade);
  });

  it('Модификатор не влияет на укрытие от других карт', () => {
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Создаем мок другой карты
    const otherCard = new MockCard({
      room,
      name: 'Другая карта',
      type: CryptozShared.ECardType.SPARK,
    });

    // Симулируем базовое значение возможности укрытия
    const baseCanEvade = true;

    // Применяем модификаторы
    let result = baseCanEvade;
    activePlayer.modifiersCanEvade.array.forEach(modifier => {
      result = modifier.modifier(result, otherCard);
    });

    expect(result).toBe(baseCanEvade);
  });
});
