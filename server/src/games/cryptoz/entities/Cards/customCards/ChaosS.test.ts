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
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { ChaosS } from './ChaosS';

describe('ChaosS', () => {
  let card: ChaosS;
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

    card = new ChaosS(room);
  });

  it('Инстанс создается', () => {
    const card = new ChaosS();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_S);
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
    const card = new ChaosS(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CHAOS_S);
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
      strike: 'Противник справа может уничтожить карту в руке и карту в сбросе',
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
    it('Правый участник может уничтожить карту из руки', async () => {
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, thirdPlayer);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(room.socketService, 'selectCards').mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, [handCard]),
        variant: 1,
      });

      await card.playStrike({ tempPlayer: activePlayer });

      expect(thirdPlayer.hand.getCard(handCard)).toBeNull();
      expect(room.removed.cards.getCard(handCard)).toBe(handCard);
    });

    it('Правый участник может уничтожить карту из сброса', async () => {
      const discardCard = new MockCard({ room });
      addCardToPlayerDiscard(discardCard, thirdPlayer);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(room.socketService, 'selectCards')
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY),
          variant: 2,
        })
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY, [discardCard]),
          variant: 1,
        });

      await card.playStrike({ tempPlayer: activePlayer });

      expect(thirdPlayer.discard.getCard(discardCard)).toBeNull();
      expect(room.removed.cards.getCard(discardCard)).toBe(discardCard);
    });

    it('Участник может укрыться от эффекта', async () => {
      // Добавляем карты в руку активного участника
      const handCard = new MockCard({ room });
      addCardToPlayerHand(handCard, activePlayer);

      // Мокаем tryEvade - участник укрывается
      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(true);

      // Мокаем selectCards
      vi.spyOn(room.socketService, 'selectCards').mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY),
        variant: 2,
      });

      await card.playStrike({ tempPlayer: activePlayer, canEvade: true });

      // Проверяем, что карта не была уничтожена
      expect(activePlayer.hand.getCard(handCard)).toBe(handCard);
      expect(room.removed.cards.getCard(handCard)).toBeNull();
    });

    it('Не работает без правого участника', async () => {
      room.players.removePlayer(player);
      room.players.removePlayer(thirdPlayer);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      await card.playStrike({ tempPlayer: activePlayer });
    });

    it('Правый участник может отказаться от уничтожения карт', async () => {
      const handCard = new MockCard({ room });
      const discardCard = new MockCard({ room });
      addCardToPlayerHand(handCard, thirdPlayer);
      addCardToPlayerDiscard(discardCard, thirdPlayer);

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(room.socketService, 'selectCards')
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY),
          variant: 2,
        })
        .mockResolvedValueOnce({
          cards: new CardGroup(ECardGroupType.ANY),
          variant: 2,
        });

      await card.playStrike({ tempPlayer: activePlayer });

      expect(thirdPlayer.hand.getCard(handCard)).toBe(handCard);
      expect(thirdPlayer.discard.getCard(discardCard)).toBe(discardCard);
      expect(room.removed.cards.count).toBe(0);
    });

    it('Работает с пустыми рукой и сбросом', async () => {
      thirdPlayer.hand.clear();
      thirdPlayer.discard.clear();

      vi.spyOn(activePlayer, 'tryEvade').mockResolvedValue(false);

      vi.spyOn(room.socketService, 'selectCards').mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY),
        variant: 2,
      });

      await card.playStrike({ tempPlayer: activePlayer });

      expect(room.socketService.selectCards).toHaveBeenCalledTimes(0);
    });
  });
});
