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
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { Discharge } from './Discharge';
import { ArchitectOfIllusoryNets } from './ArchitectOfIllusoryNets';

describe('ArchitectOfIllusoryNets', () => {
  let card: ArchitectOfIllusoryNets;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new ArchitectOfIllusoryNets(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ArchitectOfIllusoryNets();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ARCHITECT_OF_ILLUSORY_NETS);
    expect(card.name).toBe('Архитектор Иллюзорных Сетей');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ArchitectOfIllusoryNets(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ARCHITECT_OF_ILLUSORY_NETS);
    expect(card.name).toBe('Архитектор Иллюзорных Сетей');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      evade: 'Возьми 2 карты, сбрось 1 из них',
    });
  });

  it('Разыгрывается general: +2 эссенции', async () => {
    activePlayer.arena.addCardToTop(card);
    await card.playGeneral();
    expect(activePlayer.essenceToSpend).toBe(2);
  });

  it('Разыгрывается evade: взять 2 карты, сбросить 1', async () => {
    // В руке 3 карты, после взятия будет 5
    activePlayer.hand.clear();
    const card1 = new MockCard({ room });
    const card2 = new MockCard({ room });
    const card3 = new MockCard({ room });
    addCardToPlayerHand(card1, activePlayer);
    addCardToPlayerHand(card2, activePlayer);
    addCardToPlayerHand(card3, activePlayer);
    // После взятия 2 карт — 5 карт в руке
    const newCard1 = new MockCard({ room });
    const newCard2 = new MockCard({ room });
    activePlayer.deck.addCardToTop(newCard2);
    activePlayer.deck.addCardToTop(newCard1);
    // Мокаем выбор карты для сброса
    const discardGroup = new CardGroup(ECardGroupType.ANY, [card2]);
    room.socketService.selectCards = vi.fn().mockResolvedValue({ cards: discardGroup });
    const discardSpy = vi.spyOn(activePlayer, 'discardHand');
    await card.playEvadeHandler();
    expect(activePlayer.hand.count).toBe(4); // 5 - 1 сброшена
    expect(discardSpy).toHaveBeenCalledWith(discardGroup);
  });

  it('Разыгрывается evade: если карты не брал — не сбрасывает', async () => {
    player.deck.clear();
    player.discard.clear();
    activePlayer.hand.clear();

    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new ArchitectOfIllusoryNets(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);

    await cardAttack.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.hand.count).toBe(5);
  });

  it('Разыгрывается evade: если взял меньше 2 карт — не сбрасывает', async () => {
    player.deck.array = [player.deck.top!];
    player.discard.clear();
    activePlayer.hand.clear();

    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new ArchitectOfIllusoryNets(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);

    await cardAttack.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(player.hand.count).toBe(6);
  });

  it('Разыгрывается укрытие при атаке', async () => {
    activePlayer.hand.clear();
    player.hand.clear();
    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new ArchitectOfIllusoryNets(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    // Мокаем выбор карты для сброса
    const discardGroup = new CardGroup(ECardGroupType.ANY, [player.deck.top!]);
    room.socketService.selectCards = vi.fn().mockResolvedValue({ cards: discardGroup });
    await cardAttack.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(player.hand.count).toBe(1);
    expect(player.health).toBe(20);

    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.hand.getCard(cardEvade)).toBeNull();
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const cardEvade = new ArchitectOfIllusoryNets(room);
    addCardToPlayerHand(cardEvade, activePlayer);
    // Мокаем выбор карты для сброса
    const discardGroup = new CardGroup(ECardGroupType.ANY, [cardEvade]);
    room.socketService.selectCards = vi.fn().mockResolvedValue({ cards: discardGroup });
    const discardSpy = vi.spyOn(activePlayer, 'discardHand');
    await cardEvade.playEvadeHandler();
    expect(discardSpy).toHaveBeenCalledWith(discardGroup);
  });
});
