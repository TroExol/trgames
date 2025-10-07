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
import {
  addCardToPlayerHand,
  addPlayerToRoom,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { SmolderingEnd } from './SmolderingEnd';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('SmolderingEnd', () => {
  let card: SmolderingEnd;
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
    card = new SmolderingEnd(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SmolderingEnd();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SMOLDERING_END);
    expect(card.name).toBe('Тлеющий конец');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SmolderingEnd(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SMOLDERING_END);
    expect(card.name).toBe('Тлеющий конец');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(9);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 3 карты, получи 3 урона',
      totalStrike: 'Каждый участник кладет карту из руки в сброс противника слева от себя, и противник получает урон, равный удвоенной стоимости переданной карты',
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

  it('Разыгрывается основная способность: взять 3 карты, получить 3 урона', async () => {
    const initialHandCount = activePlayer.hand.count;
    const initialHealth = activePlayer.health;
    const initialDeckCount = activePlayer.deck.count;

    await card.play();

    expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 3);
    expect(activePlayer.health).toBe(initialHealth - 3);
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.deck.count).toBe(initialDeckCount - 3);
  });

  it('Основная способность работает с пустой стопкой', async () => {
    activePlayer.takeCardsToDiscard(activePlayer.deck, activePlayer.deck);
    const initialHandCount = activePlayer.hand.count;
    const initialHealth = activePlayer.health;

    await card.play();

    expect(activePlayer.hand.count).toBe(initialHandCount - 1 + 3);
    expect(activePlayer.health).toBe(initialHealth - 3);
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.deck.count).not.toBe(0);
  });

  describe('Тотальный мракобой', () => {
    let player2: Player;
    let player3: Player;
    let mockCard1: MockCard;
    let mockCard2: MockCard;
    let mockCard3: MockCard;
    let mockCard4: MockCard;

    beforeEach(() => {
      player2 = new Player({ room, nickname: 'player2', participant: 'player' });
      player3 = new Player({ room, nickname: 'player3', participant: 'player' });
      addPlayerToRoom(player2, room);
      addPlayerToRoom(player3, room);

      mockCard1 = new MockCard({ room, price: 1 });
      mockCard2 = new MockCard({ room, price: 2 });
      mockCard3 = new MockCard({ room, price: 3 });
      mockCard4 = new MockCard({ room, price: 4 });

      addCardToPlayerHand(mockCard1, activePlayer);
      addCardToPlayerHand(mockCard2, player);
      addCardToPlayerHand(mockCard3, player2);
      addCardToPlayerHand(mockCard4, player3);
    });

    it('Не выполняется при недостаточном количестве участников', async () => {
      room.players.removePlayer(player);
      room.players.removePlayer(player2);
      room.players.removePlayer(player3);

      const initialHealth = activePlayer.health;

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(initialHealth);
    });

    it('Не выполняется если слишком много участников укрылось', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(true);
      player2.tryEvade = vi.fn().mockResolvedValue(true);
      player3.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(activePlayer.tryEvade).toHaveBeenCalledTimes(1);
      expect(player.tryEvade).toHaveBeenCalledTimes(1);
      expect(player2.tryEvade).toHaveBeenCalledTimes(1);
      expect(player3.tryEvade).toHaveBeenCalledTimes(1);
      expect(activePlayer.health).toBe(20);
      expect(player.health).toBe(20);
      expect(player2.health).toBe(20);
      expect(player3.health).toBe(20);
    });

    it('Выполняется корректно когда достаточно незащищенных участников', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      player2.tryEvade = vi.fn().mockResolvedValue(true);
      player3.tryEvade = vi.fn().mockResolvedValue(true);

      activePlayer.discard.clear();
      player.discard.clear();
      player2.discard.clear();
      player3.discard.clear();

      room.socketService.selectCards = vi.fn().mockImplementation(({ player: p }) => {
        if (p.nickname === player.nickname) {
          return { cards: new CardGroup(ECardGroupType.ANY, [mockCard2]), variant: 1 };
        }
        return { cards: new CardGroup(ECardGroupType.ANY, [mockCard1]), variant: 1 };
      });

      const initialHealths = {
        activePlayer: activePlayer.health,
        player: player.health,
        player2: player2.health,
        player3: player3.health,
      };

      expect(activePlayer.hand.getCard(mockCard1)).not.toBeNull();
      expect(player.hand.getCard(mockCard2)).not.toBeNull();

      await card.playTotalDarknessStrike();

      // activePlayer -> player (левый), player -> activePlayer (левый)

      expect(activePlayer.hand.getCard(mockCard1)).toBeNull();
      expect(player.hand.getCard(mockCard2)).toBeNull();

      expect(player.discard.count).toBe(1); // Получил карту от activePlayer
      expect(activePlayer.discard.count).toBe(1); // Получил карту от player

      // Проверяем урон (стоимость карты * 2)
      expect(player.health).toBe(initialHealths.player - 2);
      expect(activePlayer.health).toBe(initialHealths.activePlayer - 4);

      // Защищенные участники не должны пострадать
      expect(player2.health).toBe(initialHealths.player2);
      expect(player3.health).toBe(initialHealths.player3);
      expect(player2.discard.count).toBe(0);
      expect(player3.discard.count).toBe(0);
    });

    it('Обрабатывает участников без карт в руке', async () => {
      player.discardHand(player.hand);
      activePlayer.discard.clear();

      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);
      player2.tryEvade = vi.fn().mockResolvedValue(false);
      player3.tryEvade = vi.fn().mockResolvedValue(false);

      const initialHealths = {
        activePlayer: activePlayer.health,
        player: player.health,
        player2: player2.health,
        player3: player3.health,
      };

      room.socketService.selectCards = vi.fn().mockImplementation(({ player: p }) => {
        if (p.nickname === activePlayer.nickname) {
          return { cards: new CardGroup(ECardGroupType.ANY, [mockCard1]), variant: 1 };
        } else if (p.nickname === player2.nickname) {
          return { cards: new CardGroup(ECardGroupType.ANY, [mockCard3]), variant: 1 };
        } else if (p.nickname === player3.nickname) {
          return { cards: new CardGroup(ECardGroupType.ANY, [mockCard4]), variant: 1 };
        }
      });

      await card.playTotalDarknessStrike();

      // Участник без карт не должен передать ничего, но может получить урон от других
      expect(player.hand.count).toBe(0);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.health).toBe(initialHealths.activePlayer);
      expect(player.health).toBe(initialHealths.player - 6);
      expect(player2.health).toBe(initialHealths.player2 - 8);
      expect(player3.health).toBe(initialHealths.player3 - 2);
    });
  });
});
