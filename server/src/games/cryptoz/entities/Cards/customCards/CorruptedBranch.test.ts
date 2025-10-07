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

import { Discharge } from './Discharge';
import { CorruptedBranch } from './CorruptedBranch';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('CorruptedBranch', () => {
  let card: CorruptedBranch;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new CorruptedBranch(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new CorruptedBranch();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CORRUPTED_BRANCH);
    expect(card.name).toBe('Искаженная ветвь');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new CorruptedBranch(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CORRUPTED_BRANCH);
    expect(card.name).toBe('Искаженная ветвь');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(4);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Возьми 1 карту',
      strike: 'Положи карту со стоимостью 0 из своей руки или сброса в руку противника',
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
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [activePlayer.discard.top!]),
      variant: player.nickname,
    });
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.hand.count).toBe(1);
  });

  it('Разыгрывается мракобой без карт со стоимостью 0', async () => {
    activePlayer.discard.clear();
    activePlayer.deck.clear();

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(player.hand.count).toBe(5);
  });

  it('Разыгрывается мракобой с картой со стоимостью 0 в руке', async () => {
    const zeroCostCard = new Discharge(room);
    addCardToPlayerHand(zeroCostCard, activePlayer);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [zeroCostCard]),
      variant: player.nickname,
    });

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.hand.getCard(zeroCostCard)).toBeNull();
    expect(player.hand.getCard(zeroCostCard)).toBe(zeroCostCard);
    expect(zeroCostCard.ownerNickname).toBe(player.nickname);
  });

  it('Разыгрывается мракобой с картой со стоимостью 0 в сбросе', async () => {
    const zeroCostCard = new Discharge(room);
    activePlayer.discard.addCardToTop(zeroCostCard);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [zeroCostCard]),
      variant: player.nickname,
    });

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.discard.getCard(zeroCostCard)).toBeNull();
    expect(player.hand.getCard(zeroCostCard)).toBe(zeroCostCard);
    expect(zeroCostCard.ownerNickname).toBe(player.nickname);
  });

  it('Не наносится урон, если укрылся', async () => {
    const zeroCostCard = new Discharge(room);
    addCardToPlayerHand(zeroCostCard, activePlayer);
    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [zeroCostCard]),
      variant: player.nickname,
    });

    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.hand.getCard(zeroCostCard)).toBe(zeroCostCard);
    expect(player.hand.getCard(zeroCostCard)).toBeNull();
  });
});
