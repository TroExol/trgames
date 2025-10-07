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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { HorrorMauler } from './HorrorMauler';

describe('HorrorMauler', () => {
  let card: HorrorMauler;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new HorrorMauler(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new HorrorMauler();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.HORROR_MAULER);
    expect(card.name).toBe('Громила Ужаса');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new HorrorMauler(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.HORROR_MAULER);
    expect(card.name).toBe('Громила Ужаса');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      evade: 'Возьми 1 карту и можешь уничтожить карту на руке',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    await card.play();
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.arena.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается укрытие и удаляется карта', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
    });

    await card.playEvade({ cardAttack: card, attacker: player });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(room.removed.cards.count).toBe(1);
    expect(room.removed.cards.array).toEqual([handCard]);
    expect(player.health).toBe(20);
  });

  it('Разыгрывается укрытие и не удаляется карта', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
      variant: 2,
    });

    await card.playEvade({ cardAttack: card, attacker: player });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(room.removed.cards.count).toBe(0);
    expect(player.health).toBe(20);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const handCard = new MockCard({ room });
    addCardToPlayerHand(handCard, activePlayer);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [handCard]),
      variant: 2,
    });

    await card.playEvade({ cardAttack: card });
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.hand.count).toBe(2);
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(room.removed.cards.count).toBe(0);
    expect(player.health).toBe(20);
  });
});
