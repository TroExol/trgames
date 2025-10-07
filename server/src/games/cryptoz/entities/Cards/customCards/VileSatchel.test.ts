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

import {
  addCardToPlayerHand,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { VileSatchel } from './VileSatchel';

describe('VileSatchel', () => {
  let card: VileSatchel;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new VileSatchel(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const instance = new VileSatchel();
    expect(instance).toBeDefined();
    expect(instance.id).toBe(CryptozShared.ECardId.VILE_SATCHEL);
    expect(instance.name).toBe('Гнусный ранец');
    expect(instance.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(instance.basePrice).toBe(6);
    expect(instance.baseGloryShards).toBe(2);
    expect(instance.baseEssence).toBe(3);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции. Расскрой верхнюю карту стопки, восстанови здоровье, равное стоимости карты',
    });
  });

  it('Неактивные хендлеры возвращают false', () => {
    expect(card.canPlayStrikeHandler()).toBe(false);
    expect(card.canPlaySealHandler()).toBe(false);
    expect(card.canPlayTotalDarknessStrikeHandler()).toBe(false);
    expect(card.canPlayEvadeHandler()).toBe(false);
  });

  describe('playGeneralHandler', () => {
    it('Добавляет эссенцию и восстанавливает здоровье от стоимости вскрытой карты', async () => {
      activePlayer.health = 10;
      const topCard = new MockCard({ room, price: 5 });
      activePlayer.deck.addCardToTop(topCard);
      vi.spyOn(room.socketService, 'showCards');

      void card.play();
      await vi.advanceTimersToNextTimerAsync();

      expect(activePlayer.essenceToSpend).toBe(3);
      expect(activePlayer.health).toBe(15);
      expect(room.socketService.showCards).toHaveBeenCalledTimes(1);
      expect(room.socketService.showCards).toHaveBeenCalledWith(expect.objectContaining({
        cards: expect.objectContaining({
          array: [topCard],
        }) as unknown,
      }) as unknown);
    });

    it('Не восстанавливает здоровье, если стопка пуста', async () => {
      activePlayer.health = 10;
      activePlayer.deck.clear();
      activePlayer.discard.clear();

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(3);
      expect(activePlayer.health).toBe(10);
    });

    it('Перемешивает сброс в стопку, если она пуста', async () => {
      activePlayer.health = 10;
      activePlayer.deck.clear();
      activePlayer.discard.clear();
      const topCard = new MockCard({ room, price: 5 });
      activePlayer.discard.addCardToTop(topCard);
      vi.spyOn(room.socketService, 'showCards');

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(3);
      expect(room.socketService.showCards).toHaveBeenCalledTimes(1);
      expect(activePlayer.health).toBe(15);
      expect(activePlayer.deck.count).toBe(1);
      expect(activePlayer.discard.count).toBe(0);
    });
  });
});
