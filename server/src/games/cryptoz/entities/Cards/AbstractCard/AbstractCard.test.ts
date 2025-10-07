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
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';
import { PriceModifier } from '@/games/cryptoz/customModifiers/PriceModifier';
import { HealModifier } from '@/games/cryptoz/customModifiers/HealModifier';
import { DamageModifier } from '@/games/cryptoz/customModifiers/DamageModifier';
import { CardGloryShardsModifier } from '@/games/cryptoz/customModifiers/CardGloryShardsModifier';
import { CardEssenceModifier } from '@/games/cryptoz/customModifiers/CardEssenceModifier';

import { AbstractCard } from './index';

const canPlayGeneralHandler = vi.fn().mockReturnValue(true);
const canPlayTotalDarknessStrikeHandler = vi.fn().mockReturnValue(true);
const canPlayEvadeHandler = vi.fn().mockReturnValue(true);
const canPlayStrikeHandler = vi.fn().mockReturnValue(true);
const canPlaySealHandler = vi.fn().mockReturnValue(true);
const playHandler = vi.fn().mockResolvedValue(true);
const playTotalDarknessStrikeHandler = vi.fn().mockResolvedValue(true);
const playEvadeHandler = vi.fn().mockReturnValue(true);
const playStrikeHandler = vi.fn().mockReturnValue(true);
const playSealHandler = vi.fn().mockReturnValue(true);
const onChangeOwner = vi.fn();

class TestCard extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.OBLIVION,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.SPARK,
      name: 'Тестовая карта',
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  canPlayEvadeHandler = canPlayEvadeHandler;

  canPlayGeneralHandler = canPlayGeneralHandler;

  canPlayTotalDarknessStrikeHandler = canPlayTotalDarknessStrikeHandler;

  canPlayStrikeHandler = canPlayStrikeHandler;

  canPlaySealHandler = canPlaySealHandler;

  protected playEvadeHandler = playEvadeHandler;

  protected playStrikeHandler = playStrikeHandler;

  protected playSealHandler = playSealHandler;

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: '',
  });

  protected onChangeOwner = onChangeOwner;

  protected playTotalDarknessStrikeHandler = playTotalDarknessStrikeHandler;

  protected playGeneralHandler = playHandler;
}

describe('AbstractCard', () => {
  let card: TestCard;
  let activePlayer: Player;
  let player: Player;
  let room: Room;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    card = new TestCard(room);
  });

  it('Инстанс создается', () => {
    const card = new TestCard();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.OBLIVION);
    expect(card.name).toBe('Тестовая карта');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.SPARK);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBeFalsy();
    expect(card.hasEvade).toBeFalsy();
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new TestCard(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.OBLIVION);
    expect(card.name).toBe('Тестовая карта');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.SPARK);
    expect(card.basePrice).toBe(0);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Сравнивание работает корректно', () => {
    const otherCard = new TestCard(room);
    expect(card.theSame(card)).toBeTruthy();
    expect(card.theSame(otherCard)).toBeFalsy();
    expect(card.theSameId(CryptozShared.ECardId.OBLIVION)).toBeTruthy();
    expect(card.theSameId(CryptozShared.ECardId.DISCHARGE)).toBeFalsy();
    expect(card.theSameType(CryptozShared.ECardType.SPARK)).toBeTruthy();
    expect(card.theSameType(CryptozShared.ECardType.COMPANION)).toBeFalsy();
    expect(card.theSameUuid(card.uuid)).toBeTruthy();
    expect(card.theSameUuid('asd')).toBeFalsy();
  });

  it('Владелец определяется конкретно', () => {
    expect(card.owner).toBeNull();
    card.changeOwner(activePlayer.nickname);
    expect(card.owner).toBe(activePlayer);
    expect(onChangeOwner).toHaveBeenCalledTimes(1);
  });

  it('Цена высчитывается корректно', () => {
    expect(card.getPrice(card.owner)).toBe(0);
    activePlayer.modifiersPrice.addModifier(new PriceModifier('1', price => price + 1));
    expect(card.getPrice(card.owner)).toBe(0);
    card.changeOwner(activePlayer.nickname);
    expect(card.getPrice(card.owner)).toBe(1);
  });

  it('Урон высчитывается корректно', () => {
    expect(card.getDamage(0, null)).toBe(0);
    activePlayer.modifiersDamageToOther.addModifier(new DamageModifier('1', damage => damage + 1));
    expect(card.getDamage(0, null)).toBe(0);
    player.modifiersDamageToSelf.addModifier(new DamageModifier('1', damage => damage + 1));
    expect(card.getDamage(0, null, player)).toBe(1);
    card.changeOwner(activePlayer.nickname);
    expect(card.getDamage(0, activePlayer)).toBe(1);
    expect(card.getDamage(0, activePlayer, player)).toBe(2);
    expect(card.getDamage(0, null, player)).toBe(1);
  });

  it('Лечение высчитывается корректно', () => {
    expect(card.getHeal(0, card.owner)).toBe(0);
    activePlayer.modifiersHeal.addModifier(new HealModifier('1', heal => heal + 1));
    expect(card.getHeal(0, card.owner)).toBe(0);
    card.changeOwner(activePlayer.nickname);
    expect(card.getHeal(0, card.owner)).toBe(1);
  });

  it('Эссенция высчитывается корректно', () => {
    expect(card.getEssence(card.baseEssence, card.owner)).toBe(0);
    activePlayer.modifiersCardEssence.addModifier(new CardEssenceModifier('1', essence => essence + 1));
    expect(card.getEssence(card.baseEssence, card.owner)).toBe(0);
    card.changeOwner(activePlayer.nickname);
    expect(card.getEssence(card.baseEssence, card.owner)).toBe(1);
  });

  it('Осколки величия высчитываются корректно', () => {
    expect(card.getGloryShards(card.owner)).toBe(0);
    activePlayer.modifiersCardGloryShards.addModifier(new CardGloryShardsModifier('1', gloryShards => gloryShards + 1));
    expect(card.getGloryShards(card.owner)).toBe(0);
    card.changeOwner(activePlayer.nickname);
    expect(card.getGloryShards(card.owner)).toBe(1);
  });

  it('Форматирует корректно', () => {
    const formattedCard = card.format();
    expect(formattedCard).toEqual({
      uuid: card.uuid,
      id: card.id,
      readableId: card.readableId,
      name: card.name,
      description: {
        general: '',
      },
      simpleDescription: {
        general: '',
      },
      target: card.target,
      type: card.type,
      basePrice: card.basePrice,
      baseEssence: card.baseEssence,
      baseGloryShards: card.baseGloryShards,
      price: card.getPrice(null),
      essence: card.getEssence(card.baseEssence, null),
      gloryShards: card.getGloryShards(null),
      isSeal: card.isSeal,
      isPlayingEvade: false,
      isPlayingGeneral: false,
      isPlayingStrike: false,
      isPlayingTotalStrike: false,
      isPlayingSeal: false,
      ownerNickname: card.ownerNickname,
    });

    card.changeOwner(activePlayer.nickname);
    const formattedCardForPlayer = card.format(activePlayer);
    expect(formattedCardForPlayer).toEqual({
      uuid: card.uuid,
      id: card.id,
      readableId: card.readableId,
      name: card.name,
      description: {
        general: '',
      },
      simpleDescription: {
        general: '',
      },
      target: card.target,
      type: card.type,
      basePrice: card.basePrice,
      baseEssence: card.baseEssence,
      baseGloryShards: card.baseGloryShards,
      price: card.getPrice(activePlayer),
      essence: card.getEssence(card.baseEssence, activePlayer),
      gloryShards: card.getGloryShards(activePlayer),
      isSeal: card.isSeal,
      isPlayingEvade: false,
      isPlayingGeneral: false,
      isPlayingStrike: false,
      isPlayingTotalStrike: false,
      isPlayingSeal: false,
      ownerNickname: card.ownerNickname,
    });
  });

  describe('play', () => {
    it('Карточка разыгрывается', async () => {
      const onPlayedTrigger = vi.fn();
      activePlayer.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger('1', onPlayedTrigger));
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.arena.getCountCards(card)).toBe(1);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(1);
      expect(activePlayer.playedCards.array.includes(card)).toBeTruthy();
      expect(player.playedCards.count).toBe(0);
      expect(onPlayedTrigger).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть карточку, пока она разыгрывается', async () => {
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      const playingCard = card.play();
      await card.play();
      await playingCard;
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.playedCards.count).toBe(1);
      expect(activePlayer.playedCards.array.includes(card)).toBeTruthy();
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть карточку, когда уже разыгралась', async () => {
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.playedCards.count).toBe(1);
      expect(activePlayer.playedCards.array.includes(card)).toBeTruthy();
      expect(player.playedCards.count).toBe(0);
    });

    it('Разыгрывается карточка для временного участника при применении им', async () => {
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      // Например, безумие тьмы
      await card.play({ tempPlayer: player });
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(1);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(1);
      expect(player.playedCards.array.includes(card)).toBeTruthy();
    });

    it('Разыгрывается карточка для временного участника без прямого применения', async () => {
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      // Например, разыгрывается из-за хаоса
      await card.play({ tempPlayer: player, isForChaos: true });
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(1);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть, если закончилась игра', async () => {
      room.isGameEnded = true;
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(1);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть, если игра не начата', async () => {
      room.isGameStarted = false;
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(1);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть, если нет активного участника', async () => {
      room.activePlayerNickname = undefined;
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(1);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть, если участник не активен', async () => {
      player.hand.addCardToTop(card);
      card.changeOwner(player.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(1);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Нельзя разыграть, если нет в руке участника', async () => {
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Если нельзя разыграть обработчик', async () => {
      canPlayGeneralHandler.mockReturnValueOnce(false);
      activePlayer.hand.addCardToTop(card);
      card.changeOwner(activePlayer.nickname);
      await card.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
      expect(activePlayer.arena.getCountCards(card)).toBe(1);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(1);
      expect(player.playedCards.count).toBe(0);
    });

    it('Разыгрывается условный хаос', async () => {
      await card.play({ isForChaos: true });
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });

    it('Разыгрывается карточка из-за хаоса', async () => {
      await card.play({ tempPlayer: player, isForChaos: true });
      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(activePlayer.arena.getCountCards(card)).toBe(0);
      expect(activePlayer.hand.getCountCards(card)).toBe(0);
      expect(player.arena.getCountCards(card)).toBe(0);
      expect(player.hand.getCountCards(card)).toBe(0);
      expect(activePlayer.playedCards.count).toBe(0);
      expect(player.playedCards.count).toBe(0);
    });
  });

  describe('playTotalDarknessStrike', () => {
    it('Тотальный мракобой разыгрывается', async () => {
      await card.playTotalDarknessStrike();
      expect(playTotalDarknessStrikeHandler).toHaveBeenCalledTimes(1);
    });

    it('Тотальный мракобой не разыгрывается, если нельзя', async () => {
      canPlayTotalDarknessStrikeHandler.mockReturnValueOnce(false);
      await card.playTotalDarknessStrike();
      expect(playTotalDarknessStrikeHandler).toHaveBeenCalledTimes(0);
    });
  });

  describe('playEvade', () => {
    it('Укрытие разыгрывается из руки', async () => {
      const card = new MockCard({
        room,
        hasEvade: true,
      });
      card.canPlayEvadeHandler = vi.fn().mockReturnValue(true);
      addCardToPlayerHand(card, activePlayer);
      await card.playEvade({ cardAttack: card });
      expect(card.playEvadeHandler).toHaveBeenCalledTimes(1);
    });

    it('Укрытие разыгрывается из печатей', async () => {
      const card = new MockCard({
        room,
        hasEvade: true,
        isSeal: true,
      });
      card.canPlayEvadeHandler = vi.fn().mockReturnValue(true);
      addCardToPlayerSeals(card, activePlayer);
      await card.playEvade({ cardAttack: card });
      expect(card.playEvadeHandler).toHaveBeenCalledTimes(1);
    });

    it('Укрытие не разыгрывается, если hasEvade === false', async () => {
      const card = new MockCard({
        room,
        hasEvade: false,
      });
      card.canPlayEvadeHandler = vi.fn().mockReturnValue(true);
      addCardToPlayerHand(card, activePlayer);
      await card.playEvade({ cardAttack: card });
      expect(card.playEvadeHandler).toHaveBeenCalledTimes(0);
    });

    it('Укрытие не разыгрывается, если нельзя', async () => {
      card.changeOwner(activePlayer.nickname);
      activePlayer.hand.addCardToTop(card);
      canPlayEvadeHandler.mockReturnValueOnce(false);
      await card.playEvade({ cardAttack: card });
      expect(playEvadeHandler).toHaveBeenCalledTimes(0);
    });

    it('Укрытие не разыгрывается, если нет владельца', async () => {
      await card.playEvade({ cardAttack: card });
      expect(playEvadeHandler).toHaveBeenCalledTimes(0);
    });

    it('Укрытие не разыгрывается, если не в руке или печатях', async () => {
      card.changeOwner(activePlayer.nickname);
      await card.playEvade({ cardAttack: card });
      expect(playEvadeHandler).toHaveBeenCalledTimes(0);
    });
  });
});
