import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import { Logger } from '@/helpers/Logger';
import {
  addAbilityToPlayer,
  addCardToPlayerArena,
  addCardToPlayerHand,
  addCardToPlayerSeals,
  addStoneShardToPlayer,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { SoulfireAltar } from '@/games/cryptoz/entities/Cards/customCards/SoulfireAltar';
import { OblivionChalice } from '@/games/cryptoz/entities/Cards/customCards/OblivionChalice';
import { Oblivion } from '@/games/cryptoz/entities/Cards/customCards/Oblivion';
import { DreadOneEyedWarrior } from '@/games/cryptoz/entities/Cards/customCards/DreadOneEyedWarrior';
import { Discharge } from '@/games/cryptoz/entities/Cards/customCards/Discharge';
import { DarknessShard } from '@/games/cryptoz/entities/Cards/customCards/DarknessShard';
import { DarknessMadness } from '@/games/cryptoz/entities/Cards/customCards/DarknessMadness';
import { CursedSeal } from '@/games/cryptoz/entities/Cards/customCards/CursedSeal';
import { Ability2 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability2';
import { AbilityGroup } from '@/games/cryptoz/entities/Abilities/AbilityGroup';
import { StoneShardTookTrigger } from '@/games/cryptoz/customTriggers/StoneShardTookTrigger';
import { StoneShardDiscardedTrigger } from '@/games/cryptoz/customTriggers/StoneShardDiscardedTrigger';
import { KillingTrigger } from '@/games/cryptoz/customTriggers/KillingTrigger';
import { KilledTrigger } from '@/games/cryptoz/customTriggers/KilledTrigger';
import { HealedTrigger } from '@/games/cryptoz/customTriggers/HealedTrigger';
import { DamageTrigger } from '@/games/cryptoz/customTriggers/DamageTrigger';
import { DamageTookTrigger } from '@/games/cryptoz/customTriggers/DamageTookTrigger';
import { CardTookTrigger } from '@/games/cryptoz/customTriggers/CardTookTrigger';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';
import { AbilityDiscardedTrigger } from '@/games/cryptoz/customTriggers/AbilityDiscardedTrigger';
import { GloryShardsModifier } from '@/games/cryptoz/customModifiers/GloryShardsModifier';
import { CountStoneShardsModifier } from '@/games/cryptoz/customModifiers/CountStoneShardsModifier';
import { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';
import { CanEvadeModifier } from '@/games/cryptoz/customModifiers/CanEvadeModifier';

import type { Room } from '../../Rooms/Room';

import { Player } from './index';
import { CardGroup, ECardGroupType } from '../../Cards/CardGroup';

describe('Player', () => {
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
  });

  it('Инстанс создается', () => {
    expect(activePlayer).toBeInstanceOf(Player);
    expect(activePlayer).toBeDefined();
    expect(activePlayer.nickname).toBeDefined();
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.maxHealth).toBe(25);
    expect(activePlayer.maxHand).toBe(5);
    expect(activePlayer.companion).toBeUndefined();
    expect(activePlayer.abilities).toBeInstanceOf(AbilityGroup);
    expect(activePlayer.abilities.count).toBe(0);
    expect(activePlayer.stoneShards).toBeInstanceOf(StoneShardGroup);
    expect(activePlayer.stoneShards.count).toBe(0);
    expect(activePlayer.seals).toBeInstanceOf(CardGroup);
    expect(activePlayer.seals.count).toBe(0);
    expect(activePlayer.hand).toBeInstanceOf(CardGroup);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.arena).toBeInstanceOf(CardGroup);
    expect(activePlayer.arena.count).toBe(0);
    expect(activePlayer.discard).toBeInstanceOf(CardGroup);
    expect(activePlayer.discard.count).toBe(0);
    expect(activePlayer.deck).toBeInstanceOf(CardGroup);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.isReady).toBeFalsy();
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.receivedCards.count).toBe(0);
    expect(activePlayer.boughtCards.count).toBe(0);
    expect(activePlayer.essenceWasted).toBe(0);
    expect(activePlayer.logger).toBeInstanceOf(Logger);
  });

  it('Сбрасывает атрибуты', () => {
    const card = new Oblivion(room);
    activePlayer.playedCards.addCardToTop(card);
    activePlayer.receivedCards.addCardToTop(card);
    activePlayer.boughtCards.addCardToTop(card);
    activePlayer.essenceWasted = 2;
    activePlayer.resetAttributes();
    expect(activePlayer.playedCards.count).toBe(0);
    expect(activePlayer.receivedCards.count).toBe(0);
    expect(activePlayer.boughtCards.count).toBe(0);
    expect(activePlayer.essenceWasted).toBe(0);
  });

  it('Заполняет руку', () => {
    activePlayer.discardHand(activePlayer.hand);
    activePlayer.fillHand();
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(0);
    expect(activePlayer.discard.count).toBe(5);
    activePlayer.discardHand(activePlayer.hand);
    activePlayer.fillHand();
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(0);
    activePlayer.hand.clear();
    activePlayer.discard.clear();
    activePlayer.deck.clear();
    activePlayer.fillHand();
  });

  it('Берет карты в руку', () => {
    const onCardTookTrigger = vi.fn();
    activePlayer.triggersOnCardTook.addTrigger(new CardTookTrigger('1', onCardTookTrigger));
    const card1 = activePlayer.deck.top!;
    const card2 = activePlayer.deck.array.slice(-2)[0];
    activePlayer.takeCards(2);
    expect(activePlayer.hand.count).toBe(7);
    expect(activePlayer.deck.count).toBe(3);
    expect(activePlayer.discard.count).toBe(0);
    expect(onCardTookTrigger).toHaveBeenCalledTimes(2);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'hand', card1, activePlayer.deck, activePlayer.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'hand', card2, activePlayer.deck, activePlayer.nickname);
    onCardTookTrigger.mockClear();

    activePlayer.discardHand(activePlayer.hand);
    activePlayer.takeCards(5);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(0);
    expect(onCardTookTrigger).toHaveBeenCalledTimes(5);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'hand', activePlayer.hand.array[0], activePlayer.deck, activePlayer.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'hand', activePlayer.hand.array[1], activePlayer.deck, activePlayer.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(3, 'hand', activePlayer.hand.array[2], activePlayer.deck, activePlayer.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(4, 'hand', activePlayer.hand.array[3], activePlayer.deck, activePlayer.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(5, 'hand', activePlayer.hand.array[4], activePlayer.deck, activePlayer.nickname);
    onCardTookTrigger.mockClear();

    activePlayer.hand.clear();
    activePlayer.discard.clear();
    activePlayer.deck.clear();
    activePlayer.takeCards(2);
    expect(onCardTookTrigger).toHaveBeenCalledTimes(0);
  });

  it('Берет карты в сброс откуда-то', () => {
    const onCardTookTrigger = vi.fn();
    activePlayer.triggersOnCardTook.addTrigger(new CardTookTrigger('1', onCardTookTrigger));
    const card1 = player.deck.top;
    const card2 = player.deck.array.slice(-2)[0];
    activePlayer.takeCardsToDiscard(2, player.deck);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(2);
    expect(player.deck.count).toBe(3);
    expect(onCardTookTrigger).toHaveBeenCalledTimes(2);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'discard', card1, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'discard', card2, player.deck, player.nickname);
    onCardTookTrigger.mockClear();

    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    const card3 = player.deck.top;
    const card4 = player.deck.array.slice(-2)[0];
    const card5 = player.deck.array.slice(-3)[0];
    activePlayer.takeCardsToDiscard(30, player.deck);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(5);
    expect(player.deck.count).toBe(0);
    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardTookTrigger).toHaveBeenCalledTimes(3);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'discard', card3, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'discard', card4, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(3, 'discard', card5, player.deck, player.nickname);
  });

  it('Берет карты в руку откуда-то', () => {
    const onCardTookTrigger = vi.fn();
    activePlayer.triggersOnCardTook.addTrigger(new CardTookTrigger('1', onCardTookTrigger));
    const card1 = player.deck.top;
    const card2 = player.deck.array.slice(-2)[0];
    activePlayer.takeCardsToHand(2, player.deck);
    expect(activePlayer.hand.count).toBe(7);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(0);
    expect(player.deck.count).toBe(3);
    expect(onCardTookTrigger).toHaveBeenCalledTimes(2);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'hand', card1, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'hand', card2, player.deck, player.nickname);
    onCardTookTrigger.mockClear();

    activePlayer.hand.array.forEach(card => expect(card.owner).toBe(activePlayer));
    const card3 = player.deck.top;
    const card4 = player.deck.array.slice(-2)[0];
    const card5 = player.deck.array.slice(-3)[0];
    activePlayer.takeCardsToHand(30, player.deck);
    expect(activePlayer.hand.count).toBe(10);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(0);
    expect(player.deck.count).toBe(0);
    activePlayer.hand.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardTookTrigger).toHaveBeenCalledTimes(3);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'hand', card3, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'hand', card4, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(3, 'hand', card5, player.deck, player.nickname);
  });

  it('Берет карты в личную стопку откуда-то', () => {
    const onCardTookTrigger = vi.fn();
    activePlayer.triggersOnCardTook.addTrigger(new CardTookTrigger('1', onCardTookTrigger));
    const card1 = player.deck.top;
    const card2 = player.deck.array.slice(-2)[0];
    activePlayer.takeCardsToDeck(2, player.deck);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(7);
    expect(activePlayer.discard.count).toBe(0);
    expect(player.deck.count).toBe(3);
    activePlayer.deck.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardTookTrigger).toHaveBeenCalledTimes(2);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'deck', card1, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'deck', card2, player.deck, player.nickname);
    onCardTookTrigger.mockClear();

    const card3 = player.deck.top;
    const card4 = player.deck.array.slice(-2)[0];
    const card5 = player.deck.array.slice(-3)[0];
    activePlayer.takeCardsToDeck(30, player.deck);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(10);
    expect(activePlayer.discard.count).toBe(0);
    expect(player.deck.count).toBe(0);
    activePlayer.deck.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardTookTrigger).toHaveBeenCalledTimes(3);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(1, 'deck', card3, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(2, 'deck', card4, player.deck, player.nickname);
    expect(onCardTookTrigger).toHaveBeenNthCalledWith(3, 'deck', card5, player.deck, player.nickname);
  });

  it('Не добавляет хаос при взятии карт по количеству', () => {
    const chaosCard = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
    room.deck.addCardToTop(chaosCard);

    const initialHandCount = activePlayer.hand.count;
    const initialRemovedChaosCount = room.removed.chaos.count;

    activePlayer.takeCardsToHand(1, room.deck);

    expect(activePlayer.hand.count).toBe(initialHandCount + 1);
    expect(activePlayer.hand.getCard(chaosCard)).toBeNull();
    expect(room.removed.chaos.count).greaterThanOrEqual(initialRemovedChaosCount + 1);
    expect(room.removed.chaos.getCard(chaosCard)).toBe(chaosCard);
  });

  it('Не добавляет выбранный хаос участнику', () => {
    const chaosCard = new MockCard({ room, type: CryptozShared.ECardType.CHAOS });
    room.deck.addCardToTop(chaosCard);

    const initialRemovedChaosCount = room.removed.chaos.count;

    activePlayer.takeCardsToHand(new CardGroup(ECardGroupType.ANY, [chaosCard]), room.deck);

    expect(activePlayer.hand.getCard(chaosCard)).toBeNull();
    expect(room.removed.chaos.count).toBe(initialRemovedChaosCount + 1);
    expect(room.removed.chaos.top).toBe(chaosCard);
  });

  it('Сбрасывает карты из руки', () => {
    const onCardDiscardedTrigger = vi.fn();
    activePlayer.triggersOnCardDiscarded.addTrigger(new CardDiscardedTrigger('1', onCardDiscardedTrigger));
    const card1 = activePlayer.hand.top;
    const card2 = activePlayer.hand.array.slice(-2)[0];
    activePlayer.discardHand(activePlayer.hand.getCardsFromTop(2));
    expect(activePlayer.hand.count).toBe(3);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(2);
    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(2);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(1, card1, activePlayer.hand);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(2, card2, activePlayer.hand);
    onCardDiscardedTrigger.mockClear();

    const card3 = activePlayer.hand.top;
    const card4 = activePlayer.hand.array.slice(-2)[0];
    const card5 = activePlayer.hand.array.slice(-3)[0];
    activePlayer.discardHand(activePlayer.hand);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(5);
    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(3);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(1, card3, activePlayer.hand);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(2, card4, activePlayer.hand);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(3, card5, activePlayer.hand);
    onCardDiscardedTrigger.mockClear();

    activePlayer.discardHand(activePlayer.deck);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(5);
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(0);
  });

  it('Сбрасывает карты из печатей', () => {
    const card1 = new Oblivion(room);
    const card2 = new Oblivion(room);
    const card3 = new Oblivion(room);
    addCardToPlayerSeals(card1, activePlayer);
    addCardToPlayerSeals(card2, activePlayer);
    addCardToPlayerSeals(card3, activePlayer);
    const onCardDiscardedTrigger = vi.fn();
    activePlayer.triggersOnCardDiscarded.addTrigger(new CardDiscardedTrigger('1', onCardDiscardedTrigger));
    const card4 = activePlayer.seals.top!;
    activePlayer.discardSeal(new CardGroup(ECardGroupType.ANY, [card4]));
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(1);
    expect(activePlayer.seals.count).toBe(2);
    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(1);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(1, card4, activePlayer.seals);
    onCardDiscardedTrigger.mockClear();

    activePlayer.discardSeal(activePlayer.seals);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(3);
    expect(activePlayer.seals.count).toBe(0);
    activePlayer.discard.array.forEach(card => expect(card.owner).toBe(activePlayer));
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(2);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(1, activePlayer.discard.array[1], activePlayer.seals);
    expect(onCardDiscardedTrigger).toHaveBeenNthCalledWith(2, activePlayer.discard.array[2], activePlayer.seals);
    onCardDiscardedTrigger.mockClear();

    activePlayer.discardSeal(activePlayer.deck);
    expect(activePlayer.hand.count).toBe(5);
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(3);
    expect(activePlayer.seals.count).toBe(0);
    expect(onCardDiscardedTrigger).toHaveBeenCalledTimes(0);
  });

  it('Удаляет карты', () => {
    const onCardRemovedTrigger = vi.fn();
    activePlayer.triggersOnCardRemoved.addTrigger(new CardRemovedTrigger('1', onCardRemovedTrigger));
    const topCard = activePlayer.hand.top!;
    activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [topCard]), 'hand');
    expect(onCardRemovedTrigger).toHaveBeenCalledTimes(1);
    expect(onCardRemovedTrigger).toHaveBeenCalledWith(topCard, activePlayer.hand, room.removed.cards);
    expect(room.removed.cards.array).toEqual([topCard]);
    expect(activePlayer.hand.getCard(topCard)).toBeNull();
    onCardRemovedTrigger.mockClear();

    const cursedSeal = new CursedSeal(room);
    addCardToPlayerHand(cursedSeal, activePlayer);
    activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [cursedSeal]), 'hand');
    expect(onCardRemovedTrigger).toHaveBeenCalledTimes(1);
    expect(onCardRemovedTrigger).toHaveBeenCalledWith(cursedSeal, activePlayer.hand, room.cursedSeals);
    expect(room.cursedSeals.count).toBe(17);
    expect(activePlayer.hand.getCard(cursedSeal)).toBeNull();
    onCardRemovedTrigger.mockClear();

    const darknessMadness = new DarknessMadness(room);
    addCardToPlayerHand(darknessMadness, activePlayer);
    activePlayer.removeCards(new CardGroup(ECardGroupType.ANY, [darknessMadness]), 'hand');
    expect(onCardRemovedTrigger).toHaveBeenCalledTimes(1);
    expect(onCardRemovedTrigger).toHaveBeenCalledWith(darknessMadness, activePlayer.hand, room.darknessMadness);
    expect(room.darknessMadness.count).toBe(17);
    expect(activePlayer.hand.getCard(darknessMadness)).toBeNull();
    onCardRemovedTrigger.mockClear();
  });

  it('Заполняет личную стопку', () => {
    activePlayer.fillDeck();
    expect(activePlayer.deck.count).toBe(5);
    expect(activePlayer.discard.count).toBe(0);
    activePlayer.discardHand(activePlayer.hand);
    activePlayer.fillDeck();
    expect(activePlayer.deck.count).toBe(10);
    expect(activePlayer.discard.count).toBe(0);
    activePlayer.takeCardsToDiscard(activePlayer.deck, activePlayer.deck);
    activePlayer.fillDeck();
    expect(activePlayer.deck.count).toBe(10);
    expect(activePlayer.discard.count).toBe(0);
    activePlayer.deck.clear();
    activePlayer.fillDeck();
    expect(activePlayer.deck.count).toBe(0);
    expect(activePlayer.discard.count).toBe(0);
  });

  it('Получает осколок Философского камня', async () => {
    const onStoneShardTookTrigger = vi.fn();
    activePlayer.triggersOnStoneShardTook.addTrigger(new StoneShardTookTrigger('1', onStoneShardTookTrigger));
    room.stoneShards.clear();
    const stoneShard = new StoneShard1(room);
    room.stoneShards.addStoneShardToTop(stoneShard);
    await activePlayer.takeStoneShard(stoneShard, room.stoneShards);
    expect(room.stoneShards.count).toBe(0);
    expect(stoneShard.owner).toBe(activePlayer);
    expect(activePlayer.stoneShards.array).toEqual([stoneShard]);
    expect(activePlayer.discard.count).toBe(2);
    expect(activePlayer.discard.getCountCardsByType(CryptozShared.ECardType.CURSED_SEAL)).toBe(2);
    expect(onStoneShardTookTrigger).toHaveBeenCalledTimes(1);
    expect(onStoneShardTookTrigger).toHaveBeenCalledWith(stoneShard, room.stoneShards, undefined);
  });

  it('Сбрасывает осколок Философского камня', () => {
    const onStoneShardDiscardedTrigger = vi.fn();
    activePlayer.triggersOnStoneShardDiscarded.addTrigger(new StoneShardDiscardedTrigger('1', onStoneShardDiscardedTrigger));
    room.stoneShards.clear();
    const stoneShard = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
    activePlayer.discardStoneShard(activePlayer.stoneShards);
    expect(room.stoneShards.count).toBe(1);
    expect(room.stoneShards.getStoneShard(stoneShard)).toBe(stoneShard);
    expect(stoneShard.owner).toBeNull();
    expect(activePlayer.stoneShards.count).toBe(0);
    expect(onStoneShardDiscardedTrigger).toHaveBeenCalledTimes(1);
    expect(onStoneShardDiscardedTrigger).toHaveBeenCalledWith(stoneShard);
  });

  it('Сбрасывает способность', () => {
    const onAbilityDiscardedTrigger = vi.fn();
    activePlayer.triggersOnAbilityDiscarded.addTrigger(new AbilityDiscardedTrigger('1', onAbilityDiscardedTrigger));
    const topAbility = room.abilities.top!;
    addAbilityToPlayer(topAbility, activePlayer);
    activePlayer.discardAbilities(activePlayer.abilities);
    expect(room.abilities.count).toBe(9);
    expect(room.abilities.getAbility(topAbility)).toBe(topAbility);
    expect(topAbility.owner).toBeNull();
    expect(activePlayer.abilities.count).toBe(0);
    expect(onAbilityDiscardedTrigger).toHaveBeenCalledTimes(1);
    expect(onAbilityDiscardedTrigger).toHaveBeenCalledWith(topAbility);
  });

  it('Добавляет эссенцию на ход', async () => {
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.essenceToSpend).toBe(0);
    activePlayer.addEssenceOnTurn(2);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.essenceToSpend).toBe(0);
    activePlayer.addEssenceOnTurn(4);
    expect(activePlayer.essenceToSpend).toBe(6);
    expect(player.essenceToSpend).toBe(0);
    await room.endTurn(player);
    expect(room.activePlayer).toBe(player);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(player.essenceToSpend).toBe(0);
  });

  it('Сравнение работает корректно', () => {
    expect(activePlayer.theSame(activePlayer)).toBeTruthy();
    expect(activePlayer.theSame(player)).toBeFalsy();
    expect(activePlayer.theSameNickname(activePlayer.nickname)).toBeTruthy();
    expect(activePlayer.theSameNickname(player.nickname)).toBeFalsy();
  });

  it('Атакует другого участника', () => {
    const onDamageTrigger = vi.fn();
    activePlayer.triggersOnDamage.addTrigger(new DamageTrigger('1', onDamageTrigger));
    expect(activePlayer.attack(player, 2)).toBeFalsy();
    expect(onDamageTrigger).toHaveBeenCalledTimes(1);
    expect(onDamageTrigger).toHaveBeenCalledWith(2, player);
    expect(player.health).toBe(18);
    onDamageTrigger.mockClear();

    const onKillingTrigger = vi.fn();
    activePlayer.triggersOnKilling.addTrigger(new KillingTrigger('1', onKillingTrigger));
    const stoneShard1 = new StoneShard1(room);
    room.stoneShards.clear();
    room.stoneShards.addStoneShardToTop(stoneShard1);
    expect(activePlayer.attack(player, 18)).toBeTruthy();
    expect(player.health).toBe(20);
    expect(onDamageTrigger).toHaveBeenCalledTimes(1);
    expect(onDamageTrigger).toHaveBeenCalledWith(18, player);
    expect(onKillingTrigger).toHaveBeenCalledTimes(1);
    expect(onKillingTrigger).toHaveBeenCalledWith(player);
    onDamageTrigger.mockClear();
    onKillingTrigger.mockClear();

    room.stoneShards.addStoneShardToTop(stoneShard1);
    expect(activePlayer.attack(player, 40)).toBeTruthy();
    expect(player.health).toBe(20);
    expect(onDamageTrigger).toHaveBeenCalledTimes(1);
    expect(onDamageTrigger).toHaveBeenCalledWith(20, player);
    expect(onKillingTrigger).toHaveBeenCalledTimes(1);
    expect(onKillingTrigger).toHaveBeenCalledWith(player);
    onDamageTrigger.mockClear();
    onKillingTrigger.mockClear();
  });

  describe('takeDamage', () => {
    it('Получает урон', () => {
      const onDamageTookTrigger = vi.fn();
      player.triggersOnDamageTook.addTrigger(new DamageTookTrigger('1', onDamageTookTrigger));
      expect(player.takeDamage(2, activePlayer)).toBeFalsy();
      expect(player.health).toBe(18);
      expect(onDamageTookTrigger).toHaveBeenCalledTimes(1);
      expect(onDamageTookTrigger).toHaveBeenCalledWith(2, activePlayer);
    });

    it('Получает урон, умирает и берет осколок Философского камня', () => {
      const stoneShard1 = new StoneShard1(room);
      room.stoneShards.clear();
      room.stoneShards.addStoneShardToTop(stoneShard1);
      const onDamageTookTrigger = vi.fn();
      const onKilledTrigger = vi.fn();
      player.triggersOnDamageTook.addTrigger(new DamageTookTrigger('1', onDamageTookTrigger));
      player.triggersOnKilled.addTrigger(new KilledTrigger('1', onKilledTrigger));
      expect(player.takeDamage(30, activePlayer)).toBeTruthy();
      expect(room.stoneShards.count).toBe(0);
      expect(player.health).toBe(20);
      expect(player.stoneShards.count).toBe(1);
      expect(player.stoneShards.getStoneShard(stoneShard1)).toBe(stoneShard1);
      expect(player.discard.count).toBe(2);
      expect(player.discard.getCountCardsById(CryptozShared.ECardId.CURSED_SEAL)).toBe(2);
      expect(room.darknessCrown.owner).toBe(activePlayer);
      expect(onDamageTookTrigger).toHaveBeenCalledTimes(1);
      expect(onDamageTookTrigger).toHaveBeenCalledWith(20, activePlayer);
      expect(onKilledTrigger).toHaveBeenCalledTimes(1);
      expect(onKilledTrigger).toHaveBeenCalledWith(activePlayer);
    });

    it('Получает урон, умирает и берет осколок Философского камня без атакующего', () => {
      const stoneShard1 = new StoneShard1(room);
      room.stoneShards.clear();
      room.stoneShards.addStoneShardToTop(stoneShard1);
      const onDamageTookTrigger = vi.fn();
      const onKilledTrigger = vi.fn();
      player.triggersOnDamageTook.addTrigger(new DamageTookTrigger('1', onDamageTookTrigger));
      player.triggersOnKilled.addTrigger(new KilledTrigger('1', onKilledTrigger));
      expect(player.takeDamage(30)).toBeTruthy();
      expect(room.stoneShards.count).toBe(0);
      expect(player.health).toBe(20);
      expect(player.stoneShards.count).toBe(1);
      expect(player.stoneShards.getStoneShard(stoneShard1)).toBe(stoneShard1);
      expect(player.discard.count).toBe(2);
      expect(player.discard.getCountCardsById(CryptozShared.ECardId.CURSED_SEAL)).toBe(2);
      expect(room.darknessCrown.owner).toBeNull();
      expect(onDamageTookTrigger).toHaveBeenCalledTimes(1);
      expect(onDamageTookTrigger).toHaveBeenCalledWith(20, undefined);
      expect(onKilledTrigger).toHaveBeenCalledTimes(1);
      expect(onKilledTrigger).toHaveBeenCalledWith();
    });

    it('Получает урон, умирает и не берет осколок Философского камня', () => {
      const stoneShard1 = new StoneShard1(room);
      room.stoneShards.clear();
      room.stoneShards.addStoneShardToTop(stoneShard1);
      const onDamageTookTrigger = vi.fn();
      const onKilledTrigger = vi.fn();
      player.triggersOnDamageTook.addTrigger(new DamageTookTrigger('1', onDamageTookTrigger));
      player.triggersOnKilled.addTrigger(new KilledTrigger('1', onKilledTrigger));
      expect(player.takeDamage(30, activePlayer, false)).toBeTruthy();
      expect(room.stoneShards.count).toBe(1);
      expect(player.health).toBe(20);
      expect(player.stoneShards.count).toBe(0);
      expect(player.discard.count).toBe(0);
      expect(room.darknessCrown.owner).toBe(activePlayer);
      expect(onDamageTookTrigger).toHaveBeenCalledTimes(1);
      expect(onDamageTookTrigger).toHaveBeenCalledWith(20, activePlayer);
      expect(onKilledTrigger).toHaveBeenCalledTimes(1);
      expect(onKilledTrigger).toHaveBeenCalledWith(activePlayer);
    });
  });

  describe('tryEvade', () => {
    it('Укрывается от мракобоя', async () => {
      const discharge = new Discharge(room);
      addCardToPlayerHand(discharge, activePlayer);
      const oblivionChalice = new OblivionChalice(room);
      addCardToPlayerHand(oblivionChalice, player);
      room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(oblivionChalice);
      const evading = player.tryEvade({
        attacker: activePlayer,
        cardAttack: discharge,
        damage: 1,
        cardsToShow: player.deck,
        title: 'Укрываешься?',
      });
      expect(room.socketService.pendingAck.size).toBe(1);
      expect(await evading).toBeTruthy();
      // Ожидаем выполнение playEvade
      await Promise.resolve();
      expect(room.socketService.pendingAck.size).toBe(0);
      expect(activePlayer.health).toBe(15);
      expect(player.health).toBe(20);
      expect(player.hand.count).toBe(6);
      expect(player.hand.getCard(oblivionChalice)).toBeNull();
      expect(player.discard.count).toBe(1);
      expect(player.discard.getCard(oblivionChalice)).toBe(oblivionChalice);
      expect(room.socketService.selectEvadeCard).toHaveBeenCalledTimes(1);
    });

    it('Укрывается от мракобоя без атакующего', async () => {
      const discharge = new Discharge(room);
      const oblivionChalice = new OblivionChalice(room);
      addCardToPlayerHand(oblivionChalice, player);
      room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(oblivionChalice);
      const evading = player.tryEvade({
        cardAttack: discharge,
        damage: 1,
        title: 'Укрываешься?',
      });
      expect(room.socketService.pendingAck.size).toBe(1);
      expect(await evading).toBeTruthy();
      // Ожидаем выполнение playEvade
      await Promise.resolve();
      expect(room.socketService.pendingAck.size).toBe(0);
      expect(activePlayer.health).toBe(20);
      expect(player.health).toBe(20);
      expect(player.hand.count).toBe(6);
      expect(player.discard.count).toBe(1);
      expect(player.discard.getCard(oblivionChalice)).toBe(oblivionChalice);
      expect(room.socketService.selectEvadeCard).toHaveBeenCalledTimes(1);
    });

    it('Не укрывается от мракобоя по своему желанию', async () => {
      const discharge = new Discharge(room);
      const oblivionChalice = new OblivionChalice(room);
      addCardToPlayerHand(oblivionChalice, player);
      room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(null);
      const evading = player.tryEvade({
        attacker: activePlayer,
        cardAttack: discharge,
        damage: 1,
        title: 'Укрываешься?',
      });
      expect(room.socketService.pendingAck.size).toBe(1);
      expect(await evading).toBeFalsy();
      // Проверяем, что playEvade не выполняется
      await Promise.resolve();
      expect(room.socketService.pendingAck.size).toBe(0);
      expect(activePlayer.health).toBe(20);
      expect(player.health).toBe(20);
      expect(player.hand.count).toBe(6);
      expect(player.hand.getCard(oblivionChalice)).toBe(oblivionChalice);
      expect(player.discard.count).toBe(0);
      expect(room.socketService.selectEvadeCard).toHaveBeenCalledTimes(1);
    });

    it('Не укрывается от мракобоя, если нет карт', async () => {
      const discharge = new Discharge(room);
      room.socketService.selectEvadeCard = vi.fn();
      const evading = player.tryEvade({
        attacker: activePlayer,
        cardAttack: discharge,
        damage: 1,
        title: 'Укрываешься?',
      });
      expect(room.socketService.pendingAck.size).toBe(1);
      vi.advanceTimersToNextTimer();
      expect(await evading).toBeFalsy();
      // Проверяем, что playEvade не выполняется
      await Promise.resolve();
      expect(room.socketService.pendingAck.size).toBe(0);
      expect(activePlayer.health).toBe(20);
      expect(player.health).toBe(20);
      expect(player.hand.count).toBe(5);
      expect(player.discard.count).toBe(0);
      expect(room.socketService.selectEvadeCard).toHaveBeenCalledTimes(0);
    });

    it('Не укрывается от мракобоя, если есть модификатор', async () => {
      const discharge = new Discharge(room);
      room.socketService.selectEvadeCard = vi.fn();
      const oblivionChalice = new OblivionChalice(room);
      addCardToPlayerHand(oblivionChalice, player);
      player.modifiersCanEvade.addModifier(new CanEvadeModifier('1', () => false));
      const evading = player.tryEvade({
        attacker: activePlayer,
        cardAttack: discharge,
        damage: 1,
        title: 'Укрываешься?',
      });
      expect(room.socketService.pendingAck.size).toBe(1);
      vi.advanceTimersToNextTimer();
      expect(await evading).toBeFalsy();
      expect(room.socketService.pendingAck.size).toBe(0);
      expect(room.socketService.selectEvadeCard).toHaveBeenCalledTimes(0);
      expect(activePlayer.health).toBe(20);
      expect(player.health).toBe(20);
    });
  });

  describe('selectAbilityAndCompanion', () => {
    it('Выбирает способность и помощника', async () => {
      room.abilities.array.splice(2);
      const topAbility = room.abilities.top!;
      room.companions.array.splice(2);
      const topCompanion = room.companions.top!;
      room.settings.maxPlayers = 2;
      activePlayer.discardAbilities(activePlayer.abilities);
      player.discardAbilities(activePlayer.abilities);
      activePlayer.companion = undefined;
      player.discardAbilities(activePlayer.abilities);
      room.socketService.selectAbilityAndCompanion = vi.fn().mockResolvedValue({
        ability: topAbility,
        companion: topCompanion,
      });
      const selecting = activePlayer.selectAbilityAndCompanion();
      expect(room.companions.count).toBe(0);
      expect(room.abilities.count).toBe(0);
      await selecting;
      expect(room.socketService.selectAbilityAndCompanion).toHaveBeenCalledTimes(1);
      expect(room.companions.count).toBe(1);
      expect(room.companions.getCard(topCompanion)).toBeNull();
      expect(room.abilities.count).toBe(1);
      expect(room.abilities.getAbility(topAbility)).toBeNull();
    });

    it('Не выбирает способность и помощника, если пропадает сокет', async () => {
      vi.spyOn(activePlayer, 'selectAbilityAndCompanion');
      room.socketService.selectAbilityAndCompanion = vi.fn().mockResolvedValue(null);
      const selecting = activePlayer.selectAbilityAndCompanion();
      expect(room.companions.count).toBe(10);
      expect(room.abilities.count).toBe(6);
      room.socketService.sockets.removeSocketByNickname(activePlayer.nickname);
      await selecting;
      expect(room.socketService.selectAbilityAndCompanion).toHaveBeenCalledTimes(1);
      expect(activePlayer.selectAbilityAndCompanion).toHaveBeenCalledTimes(1);
      expect(room.companions.count).toBe(12);
      expect(room.abilities.count).toBe(8);
    });

    it('Не выбирает способность и помощника, если нет сокета', async () => {
      vi.spyOn(activePlayer, 'selectAbilityAndCompanion');
      room.socketService.selectAbilityAndCompanion = vi.fn().mockResolvedValue(null);
      room.socketService.sockets.removeSocketByNickname(activePlayer.nickname);

      const selecting = activePlayer.selectAbilityAndCompanion();
      expect(room.companions.count).toBe(10);
      expect(room.abilities.count).toBe(6);
      await selecting;
      expect(room.socketService.selectAbilityAndCompanion).toHaveBeenCalledTimes(1);
      expect(activePlayer.selectAbilityAndCompanion).toHaveBeenCalledTimes(1);
      expect(room.companions.count).toBe(12);
      expect(room.abilities.count).toBe(8);
    });
  });

  it('Восстанавливает здоровье', () => {
    const onHealedTrigger = vi.fn();
    activePlayer.triggersOnHealed.addTrigger(new HealedTrigger('1', onHealedTrigger));
    activePlayer.heal(3);
    expect(activePlayer.health).toBe(23);
    expect(onHealedTrigger).toHaveBeenCalledTimes(1);
    expect(onHealedTrigger).toHaveBeenCalledWith(20, 3);
    onHealedTrigger.mockClear();

    activePlayer.heal(20);
    expect(activePlayer.health).toBe(25);
    expect(onHealedTrigger).toHaveBeenCalledTimes(1);
    expect(onHealedTrigger).toHaveBeenCalledWith(23, 2);
    onHealedTrigger.mockClear();

    activePlayer.heal(20);
    expect(activePlayer.health).toBe(25);
    expect(onHealedTrigger).toHaveBeenCalledTimes(0);
  });

  describe('buyCard', () => {
    const onCardBought = vi.fn();

    beforeEach(() => {
      activePlayer.triggersOnCardBought.addTrigger(new CardBoughtTrigger('1', onCardBought));
    });

    afterEach(() => {
      onCardBought.mockClear();
    });

    it('Покупка помощника', () => {
      const companion = new OblivionChalice(room);
      companion.changeOwner(activePlayer.nickname);
      activePlayer.companion = companion;
      activePlayer.addEssenceOnTurn(6);
      activePlayer.buyCard(CryptozShared.ECardType.COMPANION);
      expect(activePlayer.discard.count).toBe(1);
      expect(activePlayer.discard.getCard(companion)).toBe(companion);
      expect(activePlayer.essenceWasted).toBe(6);
      expect(activePlayer.essenceToSpend).toBe(0);
      expect(activePlayer.boughtCards.count).toBe(1);
      expect(activePlayer.boughtCards.getCard(companion)).toBe(companion);
      expect(companion.owner).toBe(activePlayer);
      expect(onCardBought).toHaveBeenCalledTimes(1);
      expect(onCardBought).toHaveBeenCalledWith(companion, 6, 'companion');
    });

    it('Нельзя купить помощника, если не хватает эссенции', () => {
      const companion = new OblivionChalice(room);
      companion.changeOwner(activePlayer.nickname);
      activePlayer.companion = companion;
      activePlayer.addEssenceOnTurn(3);
      activePlayer.buyCard(CryptozShared.ECardType.COMPANION);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(3);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Нельзя купить помощника, если его нет', () => {
      activePlayer.addEssenceOnTurn(6);
      activePlayer.buyCard(CryptozShared.ECardType.COMPANION);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(6);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Покупка предвестника', () => {
      const harbinger = new DreadOneEyedWarrior(room);
      room.harbingers.addCardToTop(harbinger);
      activePlayer.addEssenceOnTurn(8);
      activePlayer.buyCard(CryptozShared.ECardType.HARBINGER);
      expect(activePlayer.discard.count).toBe(1);
      expect(activePlayer.discard.getCard(harbinger)).toBe(harbinger);
      expect(activePlayer.essenceWasted).toBe(8);
      expect(activePlayer.essenceToSpend).toBe(0);
      expect(activePlayer.boughtCards.count).toBe(1);
      expect(activePlayer.boughtCards.getCard(harbinger)).toBe(harbinger);
      expect(harbinger.owner).toBe(activePlayer);
      expect(onCardBought).toHaveBeenCalledTimes(1);
      expect(onCardBought).toHaveBeenCalledWith(harbinger, 8, 'harbinger');
    });

    it('Нельзя купить предвестника, если не хватает эссенции', () => {
      const harbinger = new DreadOneEyedWarrior(room);
      room.harbingers.addCardToTop(harbinger);
      activePlayer.addEssenceOnTurn(3);
      activePlayer.buyCard(CryptozShared.ECardType.HARBINGER);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(3);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(harbinger.owner).toBeNull();
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Нельзя купить предвестника, если ее нет', () => {
      room.harbingers.clear();
      activePlayer.addEssenceOnTurn(8);
      activePlayer.buyCard(CryptozShared.ECardType.HARBINGER);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(8);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Нельзя купить предвестника, если уже покупали в этот ход', () => {
      const boughtHarbinger = new DreadOneEyedWarrior(room);
      activePlayer.boughtCards.addCardToTop(boughtHarbinger);
      const harbinger = new DreadOneEyedWarrior(room);
      room.harbingers.addCardToTop(harbinger);
      activePlayer.addEssenceOnTurn(8);
      activePlayer.buyCard(CryptozShared.ECardType.HARBINGER);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(8);
      expect(activePlayer.boughtCards.count).toBe(1);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Покупка безумия тьмы', () => {
      const topCard = room.darknessMadness.top!;
      activePlayer.addEssenceOnTurn(3);
      activePlayer.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
      expect(activePlayer.discard.count).toBe(1);
      expect(activePlayer.discard.getCard(topCard)).toBe(topCard);
      expect(activePlayer.essenceWasted).toBe(3);
      expect(activePlayer.essenceToSpend).toBe(0);
      expect(activePlayer.boughtCards.count).toBe(1);
      expect(activePlayer.boughtCards.getCard(topCard)).toBe(topCard);
      expect(topCard.owner).toBe(activePlayer);
      expect(onCardBought).toHaveBeenCalledTimes(1);
      expect(onCardBought).toHaveBeenCalledWith(topCard, 3, 'darknessMadness');
    });

    it('Нельзя купить безумие тьмы, если не хватает эссенции', () => {
      activePlayer.addEssenceOnTurn(2);
      activePlayer.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(2);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Нельзя купить безумие тьмы, если ее нет', () => {
      room.darknessMadness.clear();
      activePlayer.addEssenceOnTurn(3);
      activePlayer.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(3);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Покупка карты с рынка', () => {
      const card = new SoulfireAltar(room);
      room.market.addCardToTop(card);
      activePlayer.addEssenceOnTurn(5);
      activePlayer.buyCard(card.type, card);
      expect(activePlayer.discard.count).toBe(1);
      expect(activePlayer.discard.getCard(card)).toBe(card);
      expect(activePlayer.essenceWasted).toBe(5);
      expect(activePlayer.essenceToSpend).toBe(0);
      expect(activePlayer.boughtCards.count).toBe(1);
      expect(activePlayer.boughtCards.getCard(card)).toBe(card);
      expect(card.owner).toBe(activePlayer);
      expect(onCardBought).toHaveBeenCalledTimes(1);
      expect(onCardBought).toHaveBeenCalledWith(card, 5, 'market');
    });

    it('Нельзя купить карту с рынка, если не хватает эссенции', () => {
      const card = new SoulfireAltar(room);
      room.market.addCardToTop(card);
      activePlayer.addEssenceOnTurn(2);
      activePlayer.buyCard(card.type, card);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(2);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(card.owner).toBeNull();
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });

    it('Нельзя купить карту с рынка, если ее нет', () => {
      const card = new SoulfireAltar(room);
      room.market.clear();
      activePlayer.addEssenceOnTurn(10);
      activePlayer.buyCard(card.type, card);
      expect(activePlayer.discard.count).toBe(0);
      expect(activePlayer.essenceWasted).toBe(0);
      expect(activePlayer.essenceToSpend).toBe(10);
      expect(activePlayer.boughtCards.count).toBe(0);
      expect(card.owner).toBeNull();
      expect(onCardBought).toHaveBeenCalledTimes(0);
    });
  });

  describe('toggleIsReady', () => {
    it('Переключает готовность', () => {
      const companion = new Oblivion(room);
      companion.changeOwner(activePlayer.nickname);
      activePlayer.companion = companion;
      const ability = new Ability2(room);
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      room.isGameStarted = false;
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeTruthy();
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeFalsy();
    });

    it('Не переключает готовность, если не выбраны способность и помощник', () => {
      room.isGameStarted = false;
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeFalsy();
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeFalsy();
    });

    it('Не переключает готовность, если игра началась', () => {
      const companion = new Oblivion(room);
      companion.changeOwner(activePlayer.nickname);
      activePlayer.companion = companion;
      const ability = new Ability2(room);
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      activePlayer.isReady = true;
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeTruthy();
      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeTruthy();
    });

    it('Начинает игру, когда все готовы', () => {
      room.settings.maxPlayers = 2;
      room.isGameStarted = false;

      const companion1 = new Oblivion(room);
      companion1.changeOwner(activePlayer.nickname);
      activePlayer.companion = companion1;

      const ability1 = new Ability2(room);
      ability1.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability1);

      const companion2 = new Oblivion(room);
      companion2.changeOwner(player.nickname);
      player.companion = companion2;

      const ability2 = new Ability2(room);
      ability2.changeOwner(player.nickname);
      player.abilities.addAbilityToTop(ability2);

      activePlayer.toggleIsReady();
      expect(activePlayer.isReady).toBeTruthy();
      expect(room.isGameStarted).toBeFalsy();
      player.toggleIsReady();
      expect(activePlayer.isReady).toBeTruthy();
      expect(room.isGameStarted).toBeTruthy();
    });
  });

  it('Возвращает все карты укрытия участника из руки и печатей', () => {
    expect(activePlayer.evadeCards.count).toBe(0);
    const evadeCard = new OblivionChalice(room);
    const evadeSeal = new OblivionChalice(room);
    addCardToPlayerHand(evadeCard, activePlayer);
    addCardToPlayerSeals(evadeSeal, activePlayer);
    const evadeCards = activePlayer.evadeCards;
    expect(evadeCards.count).toBe(2);
    expect(evadeCards.getCard(evadeCard)).toBe(evadeCard);
    expect(evadeCards.getCard(evadeSeal)).toBe(evadeSeal);
  });

  it('Возвращает наличие короны Мрака', () => {
    expect(activePlayer.hasDarknessCrown).toBeFalsy();
    room.darknessCrown.changeOwner(activePlayer.nickname);
    expect(activePlayer.hasDarknessCrown).toBeTruthy();
  });

  it('Возвращает количество осколков Философского камня', () => {
    expect(activePlayer.countStoneShards).toBe(0);
    const stoneShard = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard, activePlayer);
    expect(activePlayer.countStoneShards).toBe(1);
    activePlayer.modifiersCountStoneShards.addModifier(new CountStoneShardsModifier('1', count => count + 1));
    expect(activePlayer.countStoneShards).toBe(2);
  });

  it('Возвращает количество печатей', () => {
    expect(activePlayer.countSeals).toBe(0);
    const seal = new SoulfireAltar(room);
    addCardToPlayerSeals(seal, activePlayer);
    expect(activePlayer.countSeals).toBe(1);
    activePlayer.modifiersCountSeals.addModifier(new CountSealsModifier('1', count => count + 1));
    expect(activePlayer.countSeals).toBe(2);
  });

  it('Возвращает все карты', () => {
    expect(activePlayer.allCards.count).toBe(10);
    const seal = new SoulfireAltar(room);
    addCardToPlayerSeals(seal, activePlayer);
    const playedCard = new Oblivion(room);
    addCardToPlayerArena(playedCard, activePlayer);
    activePlayer.discardHand(activePlayer.hand.getCardsById(CryptozShared.ECardId.DARKNESS_SHARD));
    expect(activePlayer.allCards.count).toBe(12);
  });

  it('Возвращает количество эссенции для траты', async () => {
    expect(activePlayer.essenceToSpend).toBe(0);
    activePlayer.addEssenceOnTurn(2);
    expect(activePlayer.essenceToSpend).toBe(2);
    activePlayer.essenceWasted = 2;
    expect(activePlayer.essenceToSpend).toBe(0);
    const card = new DarknessShard(room);
    card.changeOwner(activePlayer.nickname);
    activePlayer.playedCards.addCardToTop(card);
    expect(activePlayer.essenceToSpend).toBe(0);
    const card2 = new DarknessShard(room);
    addCardToPlayerHand(card2, activePlayer);
    await card2.play();
    expect(activePlayer.essenceToSpend).toBe(1);
  });

  it('Возвращает количество эссенции в руке', () => {
    activePlayer.hand.clear();
    expect(activePlayer.essenceOfHand).toBe(0);
    activePlayer.addEssenceOnTurn(2);
    expect(activePlayer.essenceOfHand).toBe(0);
    activePlayer.essenceWasted = 2;
    expect(activePlayer.essenceOfHand).toBe(0);
    const card1 = new DarknessShard(room);
    const card2 = new DarknessShard(room);
    addCardToPlayerHand(card1, activePlayer);
    addCardToPlayerHand(card2, activePlayer);
    expect(activePlayer.essenceOfHand).toBe(2);
  });

  it('Возвращает осколки величия', () => {
    expect(activePlayer.gloryShards).toBe(0);
    const card = new SoulfireAltar(room);
    addCardToPlayerHand(card, activePlayer);
    expect(activePlayer.gloryShards).toBe(1);
    activePlayer.modifiersGloryShards.addModifier(new GloryShardsModifier('1', count => count + 1));
    expect(activePlayer.gloryShards).toBe(2);
  });

  it('Возвращает является ли участник активным', () => {
    expect(activePlayer.isActive).toBeTruthy();
    expect(player.isActive).toBeFalsy();
  });

  it('Возвращает является ли участник админом', () => {
    expect(activePlayer.isAdmin).toBeTruthy();
    expect(player.isAdmin).toBeFalsy();
  });

  describe('format', () => {
    it('Форматирует корректно', () => {
      const formatted = activePlayer.format(activePlayer);
      expect(formatted.nickname).toBe(activePlayer.nickname);
      expect(formatted.seals.length).toBe(0);
      expect(formatted.countDeck).toBe(5);
      expect(formatted.discard.length).toBe(0);
      expect(formatted.companion).toBeUndefined();
      expect(formatted.hand?.length).toBe(5);
      expect(formatted.countHand).toBe(5);
      expect(formatted.hasDarknessCrown).toBeFalsy();
      expect(formatted.hasNoctullos).toBeFalsy();
      expect(formatted.health).toBe(20);
      expect(formatted.essenceToSpend).toBe(0);
      expect(formatted.essenceOfHand).toBe(activePlayer.hand.array.reduce((acc, card) => acc + card.baseEssence, 0));
      expect(formatted.abilities.length).toBe(0);
      expect(formatted.stoneShards.length).toBe(0);
      expect(formatted.gloryShards).toBe(0);
      expect(formatted.isOnline).toBeTruthy();
      expect(formatted.isReady).toBeFalsy();
    });

    it('Форматирует корректно для другого участника', () => {
      const formatted = player.format(activePlayer);
      expect(formatted.nickname).toBe(player.nickname);
      expect(formatted.seals.length).toBe(0);
      expect(formatted.countDeck).toBe(5);
      expect(formatted.discard.length).toBe(0);
      expect(formatted.companion).toBeUndefined();
      expect(formatted.hand).toBeUndefined();
      expect(formatted.countHand).toBe(5);
      expect(formatted.hasDarknessCrown).toBeFalsy();
      expect(formatted.hasNoctullos).toBeFalsy();
      expect(formatted.health).toBe(20);
      expect(formatted.essenceToSpend).toBeUndefined();
      expect(formatted.essenceOfHand).toBeUndefined();
      expect(formatted.abilities.length).toBe(0);
      expect(formatted.stoneShards.length).toBe(0);
      expect(formatted.gloryShards).toBeUndefined();
      expect(formatted.isOnline).toBeTruthy();
      expect(formatted.isReady).toBeFalsy();
    });
  });
});
