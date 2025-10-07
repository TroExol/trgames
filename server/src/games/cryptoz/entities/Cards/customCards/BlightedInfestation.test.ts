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

import { BlightedInfestation } from './BlightedInfestation';

describe('BlightedInfestation', () => {
  let card: BlightedInfestation;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new BlightedInfestation(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new BlightedInfestation();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BLIGHTED_INFESTATION);
    expect(card.name).toBe('Зараженное нашествие');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new BlightedInfestation(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.BLIGHTED_INFESTATION);
    expect(card.name).toBe('Зараженное нашествие');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция',
      strike: 'Нанеси 3 урона противнику, и он получает Проклятую печать',
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

  it('Разыгрывается обычное свойство', async () => {
    // Добавляем карту в арену вручную, так как playGeneral не перемещает карту из руки
    activePlayer.arena.addCardToTop(card);
    activePlayer.hand.removeCard(card);

    void card.playGeneral();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.essenceToSpend).toBe(1);
  });

  it('Разыгрывается мракобой', async () => {
    const initialCursedSealsCount = room.cursedSeals.count;

    // Добавляем карту в арену вручную, так как playStrike не перемещает карту из руки
    activePlayer.arena.addCardToTop(card);
    activePlayer.hand.removeCard(card);

    void card.playStrike({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.health).toBe(17); // 20 - 3 урона
    expect(player.discard.count).toBe(1); // Получил Проклятую печать
    expect(player.discard.top?.id).toBe(CryptozShared.ECardId.CURSED_SEAL);
    expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1); // Одна печать убрана из общего пула
  });

  it('Разыгрывается мракобой с уроном 0', async () => {
    const initialCursedSealsCount = room.cursedSeals.count;

    // Добавляем карту в арену вручную, так как playStrike не перемещает карту из руки
    activePlayer.arena.addCardToTop(card);
    activePlayer.hand.removeCard(card);

    void card.playStrike({ concreteTarget: player, concreteDamage: 0 });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.health).toBe(20); // Урон не нанесен
    expect(player.discard.count).toBe(1); // Все равно получил Проклятую печать
    expect(player.discard.top?.id).toBe(CryptozShared.ECardId.CURSED_SEAL);
    expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1);
  });

  it('Не наносится урон и не дается печать, если укрылся', async () => {
    const initialCursedSealsCount = room.cursedSeals.count;

    // Добавляем карту в арену вручную, так как playStrike не перемещает карту из руки
    activePlayer.arena.addCardToTop(card);
    activePlayer.hand.removeCard(card);

    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    void card.playStrike({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.health).toBe(20); // Урон не нанесен
    expect(player.seals.count).toBe(0); // Печать не получена
    expect(room.cursedSeals.count).toBe(initialCursedSealsCount); // Печать не убрана из пула
  });

  it('Работает без проклятых печатей в пуле', async () => {
    room.cursedSeals.clear(); // Убираем все проклятые печати

    // Добавляем карту в арену вручную, так как playStrike не перемещает карту из руки
    activePlayer.arena.addCardToTop(card);
    activePlayer.hand.removeCard(card);

    void card.playStrike({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.health).toBe(17); // Урон все равно нанесен
    expect(player.seals.count).toBe(0); // Печать не получена, так как нет в пуле
  });

  it('Полное разыгрывание карты', async () => {
    const initialCursedSealsCount = room.cursedSeals.count;

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1); // +1 эссенция от общего свойства
    expect(player.health).toBe(17); // 20 - 3 урона от мракобоя
    expect(player.discard.count).toBe(1); // Получил Проклятую печать
    expect(player.discard.top?.id).toBe(CryptozShared.ECardId.CURSED_SEAL);
    expect(room.cursedSeals.count).toBe(initialCursedSealsCount - 1); // Одна печать убрана из общего пула
  });
});
