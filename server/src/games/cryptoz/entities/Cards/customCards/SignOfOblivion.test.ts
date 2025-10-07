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
  addCardToPlayerHand,
  addCardToPlayerSeals,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { SignOfOblivion } from './SignOfOblivion';
import { ChaosA } from './ChaosA';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('SignOfOblivion', () => {
  let card: SignOfOblivion;
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
    card = new SignOfOblivion(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SignOfOblivion();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SIGN_OF_OBLIVION);
    expect(card.name).toBe('Знак Забвения');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(card.basePrice).toBe(10);
    expect(card.baseGloryShards).toBe(5);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SignOfOblivion(room);
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SIGN_OF_OBLIVION);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Разыграй случайный хаос из уничтоженных, сам можешь не участвовать',
      totalStrike: 'Каждый участник сбрасывает 2 карты и 1 печать',
    });
  });

  describe('General', () => {
    it('Разыгрывается хаос с участием участника', async () => {
      const chaosCard = new ChaosA(room);
      room.removed.chaos.clear();
      room.removed.chaos.addCardToBottom(chaosCard);
      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 1 });
      chaosCard.play = vi.fn();

      await card.play();

      expect(chaosCard.play).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        concreteTargets: room.players,
      });
    });

    it('Разыгрывается хаос без участия участника', async () => {
      const chaosCard = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
      room.removed.chaos.addCardToBottom(chaosCard);
      room.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 2 });
      chaosCard.play = vi.fn();

      await card.play();

      expect((chaosCard.play as any).mock.calls[0][0].concreteTargets?.array)
        .toEqual(room.players.getPlayersExceptPlayer(activePlayer).array);
    });

    it('Ничего не происходит, если нет уничтоженных хаосов', async () => {
      room.socketService.selectCards = vi.fn();
      await card.play();
      expect(room.socketService.selectCards).not.toHaveBeenCalled();
    });
  });

  describe('Total Strike', () => {
    it('Участники сбрасывают 2 карты и 1 печать', async () => {
      addCardToPlayerHand(new MockCard({ room }), player);
      addCardToPlayerHand(new MockCard({ room }), player);
      const seal = new MockCard({ room });
      addCardToPlayerSeals(seal, player);

      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      const initialPlayerHand = player.hand.count;
      const initialPlayerSeals = player.seals.count;
      const initialPlayerDiscard = player.discard.count;

      room.socketService.selectCards = vi.fn()
        .mockResolvedValueOnce({ cards: new CardGroup(ECardGroupType.ANY, player.hand.array.slice(-2)) }) // сброс с руки
        .mockResolvedValueOnce({ cards: new CardGroup(ECardGroupType.ANY, [player.seals.array[0]]) }); // сброс печати

      await card.playTotalDarknessStrike();

      expect(player.hand.count).toBe(initialPlayerHand - 2);
      expect(player.seals.count).toBe(initialPlayerSeals - 1);
      expect(player.discard.count).toBe(initialPlayerDiscard + 3);
    });

    it('Участник сбрасывает меньше 2 карт, если их нет', async () => {
      addCardToPlayerHand(new MockCard({ room }), player); // только 1 карта в руке
      const initialPlayerHand = player.hand.count;
      room.socketService.selectCards = vi.fn().mockResolvedValueOnce({
        cards: new CardGroup(ECardGroupType.ANY, player.hand.array.slice(-1)),
      });
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(player.hand.count).toBe(initialPlayerHand - 1);
    });

    it('Ничего не происходит, если у участника нет печатей', async () => {
      addCardToPlayerHand(new MockCard({ room }), player);
      addCardToPlayerHand(new MockCard({ room }), player);

      const initialPlayerSeals = player.seals.count;
      const selectCardsMock = vi.fn().mockResolvedValue({
        cards: new CardGroup(ECardGroupType.ANY, player.hand.array.slice(-2)),
      });
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      room.socketService.selectCards = selectCardsMock;

      await card.playTotalDarknessStrike();

      expect(player.seals.count).toBe(initialPlayerSeals);
      expect(selectCardsMock).toHaveBeenCalledTimes(1); // Вызывается только для руки
    });

    it('Не атакует участника, если он защищен', async () => {
      const selectCardsMock = vi.fn();
      room.socketService.selectCards = selectCardsMock;
      player.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike({ target: player });

      expect(selectCardsMock).not.toHaveBeenCalled();
    });
  });
});
