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
import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { GreatSkeleton } from './GreatSkeleton';
import { DreadOneEyedWarrior } from './DreadOneEyedWarrior';
import { CrushingJaws } from './CrushingJaws';
import { CardGroup, ECardGroupType } from '../CardGroup';

describe('CrushingJaws', () => {
  let card: CrushingJaws;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    card = new CrushingJaws(room);
    addCardToPlayerHand(card, activePlayer);
    room.socketService.selectCards = vi.fn().mockResolvedValue(new CardGroup(ECardGroupType.ANY));
  });

  it('Инстанс создается', () => {
    const newCard = new CrushingJaws();
    expect(newCard).toBeDefined();
    expect(newCard.id).toBe(CryptozShared.ECardId.CRUSHING_JAWS);
    expect(newCard.name).toBe('Сокрушающие Челюсти');
    expect(newCard.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(newCard.basePrice).toBe(5);
    expect(newCard.baseEssence).toBe(2);
    expect(newCard.baseGloryShards).toBe(1);
    expect(newCard.logger).toBeInstanceOf(Logger);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Нанеси 4 урона каждому противнику за каждого предвестника в его сбросе. Если не нанес урон, можешь уничтожить карту в руке',
    });
  });

  it('Общее действие: дает +2 эссенции', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    await card.play();
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
  });

  it('Мракобой: наносит урон за Предвестников в сбросе', async () => {
    const harbingerCard = new DreadOneEyedWarrior(room); // Это Предвестник
    player.discard.addCardToTop(harbingerCard);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(player.health).toBe(20 - 4); // 4 урона за 1 предвестника
  });

  it('Мракобой: не наносит урон, если нет Предвестников', async () => {
    const initialHealth = player.health;
    await card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(initialHealth);
  });

  it('Мракобой: позволяет уничтожить карту, если урон не нанесен', async () => {
    const cardInHand = new GreatSkeleton(room);
    addCardToPlayerHand(cardInHand, activePlayer);

    const initialHandCount = activePlayer.hand.count;
    const selectedCards = new CardGroup(ECardGroupType.ANY, [activePlayer.hand.top!]);
    room.socketService.selectCards = vi.fn().mockResolvedValue({ cards: selectedCards, variant: 1 });

    await card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.hand.count).toBe(initialHandCount - 2);
    expect(activePlayer.hand.getCard(cardInHand)).toBeNull();
    expect(room.removed.cards.getCard(cardInHand)).toBe(cardInHand);
  });

  it('Мракобой: ничего не делает, если урон не нанесен и нет карт в руке для уничтожения', async () => {
    activePlayer.hand.clear();
    addCardToPlayerHand(card, activePlayer); // только сама карта в руке

    const initialRemovedCount = room.removed.cards.count;
    await card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(room.removed.cards.count).toBe(initialRemovedCount);
    expect(activePlayer.hand.count).toBe(0); // карта разыграна
    expect(room.removed.cards.getCard(card)).toBeNull();
  });

  it('Мракобой: ничего не делает, если урон не нанесен и участник отменил выбор', async () => {
    const cardInHand = new GreatSkeleton(room);
    addCardToPlayerHand(cardInHand, activePlayer);

    const initialHandCount = activePlayer.hand.count;
    room.socketService.selectCards
     = vi.fn().mockResolvedValue({ cards: new CardGroup(ECardGroupType.ANY), variant: 2 }); // Пустой выбор

    await card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.hand.count).toBe(initialHandCount - 1); // разыгранная карта ушла
    expect(room.removed.cards.getCard(cardInHand)).toBeNull();
  });

  it('Мракобой: урон не наносится, если противник укрылся', async () => {
    const harbingerCard = new DreadOneEyedWarrior(room);
    player.discard.addCardToTop(harbingerCard);
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    const initialHealth = player.health;
    await card.play();
    await vi.advanceTimersToNextTimerAsync();
    expect(player.health).toBe(initialHealth);
  });
});
