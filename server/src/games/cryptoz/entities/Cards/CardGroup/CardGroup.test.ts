import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import { Oblivion } from '@/games/cryptoz/entities/Cards/customCards/Oblivion';
import { Discharge } from '@/games/cryptoz/entities/Cards/customCards/Discharge';

import { CardGroup, ECardGroupType } from './index';

describe('CardGroup', () => {
  let cardGroup: CardGroup<ECardGroupType.ANY>;

  beforeEach(() => {
    cardGroup = new CardGroup(ECardGroupType.ANY);
  });

  it('Инстанс создается', () => {
    expect(cardGroup).toBeInstanceOf(CardGroup);
  });

  it('Добавляет карты', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Oblivion();

    cardGroup.addCardToTop(card1);
    expect(cardGroup.top).toBe(card1);
    expect(cardGroup.bottom).toBe(card1);
    expect(cardGroup.count).toBe(1);
    cardGroup.addCardToBottom(card2);
    expect(cardGroup.top).toBe(card1);
    expect(cardGroup.bottom).toBe(card2);
    expect(cardGroup.count).toBe(2);
    cardGroup.addCardToTop(card3);
    expect(cardGroup.top).toBe(card3);
    expect(cardGroup.bottom).toBe(card2);
    expect(cardGroup.count).toBe(3);
  });

  it('Добавляет карты в случайное место', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Oblivion();

    cardGroup.addCardToRandomPlace(card1);
    expect(cardGroup.count).toBe(1);
    expect(cardGroup.array).toEqual([card1]);
    cardGroup.addCardToRandomPlace(card2);
    expect(cardGroup.array.includes(card1)).toBeTruthy();
    expect(cardGroup.array.includes(card2)).toBeTruthy();
    expect(cardGroup.count).toBe(2);
    cardGroup.addCardToRandomPlace(card3);
    expect(cardGroup.array.includes(card1)).toBeTruthy();
    expect(cardGroup.array.includes(card2)).toBeTruthy();
    expect(cardGroup.array.includes(card3)).toBeTruthy();
    expect(cardGroup.count).toBe(3);
  });

  it('Удаляет карты', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);

    expect(cardGroup.removeCard(card1)).toBe(card1);
    expect(cardGroup.count).toBe(1);
    expect(cardGroup.getCard(card1)).toBeNull();
    expect(cardGroup.getCard(card2)).toBe(card2);
    expect(cardGroup.removeCard(card1)).toBeNull();
    expect(cardGroup.count).toBe(1);
  });

  it('Удаляет карты по id', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Discharge();

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.removeCardsById(CryptozShared.ECardId.DISCHARGE).count).toBe(1);
    expect(cardGroup.count).toBe(2);
    expect(cardGroup.removeCardsById(CryptozShared.ECardId.OBLIVION).count).toBe(2);
    expect(cardGroup.count).toBe(0);
    expect(cardGroup.removeCardsById(CryptozShared.ECardId.OBLIVION).count).toBe(0);
    expect(cardGroup.count).toBe(0);
  });

  it('Удаляет карты по типу', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Discharge();

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.removeCardsByType(CryptozShared.ECardType.COMPANION).count).toBe(0);
    expect(cardGroup.count).toBe(3);
    expect(cardGroup.removeCardsByType(CryptozShared.ECardType.SPARK).count).toBe(3);
    expect(cardGroup.count).toBe(0);
    expect(cardGroup.removeCardsByType(CryptozShared.ECardType.SPARK).count).toBe(0);
    expect(cardGroup.count).toBe(0);
  });

  it('Удаляет карты снизу', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Oblivion();

    cardGroup.addCardToTop(card1);
    cardGroup.addCardToTop(card2);
    cardGroup.addCardToTop(card3);

    expect(cardGroup.removeCardsFromTop(2).array).toEqual([card2, card3]);
    expect(cardGroup.count).toBe(1);
    expect(cardGroup.getCard(card1)).toBe(card1);
    expect(cardGroup.getCard(card2)).toBeNull();
    expect(cardGroup.getCard(card3)).toBeNull();
    expect(cardGroup.removeCardsFromTop(2).array).toEqual([card1]);
    expect(cardGroup.count).toBe(0);
  });

  it('Удаляет карты сверху', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Oblivion();

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.removeCardsFromBottom(2).array).toEqual([card3, card2]);
    expect(cardGroup.count).toBe(1);
    expect(cardGroup.getCard(card1)).toBe(card1);
    expect(cardGroup.getCard(card2)).toBeNull();
    expect(cardGroup.getCard(card3)).toBeNull();
    expect(cardGroup.removeCardsFromBottom(2).array).toEqual([card1]);
    expect(cardGroup.count).toBe(0);
  });

  it('Перемешивает карты', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Discharge();

    cardGroup.shuffle();
    expect(cardGroup.array).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.shuffle();
    expect(cardGroup.array).toEqual([card1]);

    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);
    cardGroup.shuffle();
    expect(cardGroup.count).toBe(3);
  });

  it('Перемешивает карты, не мутируя исходную группу', () => {
    const card1 = new Oblivion();
    const card2 = new Oblivion();
    const card3 = new Discharge();

    const shuffled1 = cardGroup.toShuffle();
    expect(cardGroup.array).toEqual([]);
    expect(shuffled1.array).toEqual([]);
    expect(cardGroup).not.toBe(shuffled1);

    cardGroup.addCardToBottom(card1);
    const shuffled2 = cardGroup.toShuffle();
    expect(cardGroup.array).toEqual([card1]);
    expect(shuffled2.array).toEqual([card1]);

    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);
    const shuffled3 = cardGroup.toShuffle();
    expect(cardGroup.count).toBe(3);
    expect(cardGroup.array).toEqual([card3, card2, card1]);
    expect(shuffled3.count).toBe(3);
  });

  it('Получение карт работает корректно', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();
    const card4 = new Discharge();

    expect(cardGroup.getCard(card1)).toBeNull();
    expect(cardGroup.randomCard).toBeNull();
    expect(cardGroup.getCardsByType(CryptozShared.ECardType.SPARK).array).toEqual([]);
    expect(cardGroup.getCardsById(CryptozShared.ECardId.OBLIVION).array).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.getCard(card1)).toBe(card1);
    expect(cardGroup.getCard(card4)).toBeNull();
    expect(cardGroup.getCardsByType(CryptozShared.ECardType.SPARK).array).toEqual([card3, card2, card1]);
    expect(cardGroup.getCardsById(CryptozShared.ECardId.OBLIVION).array).toEqual([card3, card1]);
    expect(cardGroup.getCardsExceptCard(card3).array).toEqual([card2, card1]);
    expect(cardGroup.array.includes(cardGroup.randomCard!)).toBeTruthy();
    expect(cardGroup.getCardByUuid(card1.uuid)).toBe(card1);
    expect(cardGroup.getCardByUuid(card4.uuid)).toBeNull();
    expect(cardGroup.getCardById(CryptozShared.ECardId.OBLIVION)).toBe(card3);
    expect(cardGroup.getCardById(CryptozShared.ECardId.DISCHARGE)).toBe(card2);
    expect(cardGroup.getCardById(CryptozShared.ECardId.DARKNESS_SHARD)).toBeNull();
    expect(cardGroup.getCardByType(CryptozShared.ECardType.SPARK)).toBe(card3);
    expect(cardGroup.getCardByType(CryptozShared.ECardType.COMPANION)).toBeNull();
  });

  it('Получение количества работает корректно', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();
    const card4 = new Discharge();

    expect(cardGroup.getCountCards(card1)).toBe(0);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.getCountCards(card1)).toBe(1);
    expect(cardGroup.getCountCards(card4)).toBe(0);
    expect(cardGroup.getCountCardsById(CryptozShared.ECardId.OBLIVION)).toBe(2);
    expect(cardGroup.getCountCardsById(CryptozShared.ECardId.DISCHARGE)).toBe(1);
    expect(cardGroup.getCountCardsById(CryptozShared.ECardId.DARKNESS_SHARD)).toBe(0);
    expect(cardGroup.getCountCardsByType(CryptozShared.ECardType.SPARK)).toBe(3);
    expect(cardGroup.getCountCardsByType(CryptozShared.ECardType.COMPANION)).toBe(0);
  });

  it('Очищается', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    cardGroup.clear();

    expect(cardGroup.count).toBe(0);
  });

  it('Получает карты с максимальной стоимостью', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();

    expect(cardGroup.getMaxPriceCards().array).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.getMaxPriceCards().array).toEqual([card3, card2, card1]);
  });

  it('Получает карты с минимальной стоимостью', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();

    expect(cardGroup.getMinPriceCards().array).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.getMinPriceCards().array).toEqual([card3, card2, card1]);
  });

  it('Возвращает список id', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();

    expect(cardGroup.ids).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.ids).toEqual([
      CryptozShared.ECardId.OBLIVION,
      CryptozShared.ECardId.DISCHARGE,
      CryptozShared.ECardId.OBLIVION,
    ]);
  });

  it('Возвращает список type', () => {
    const card1 = new Oblivion();
    const card2 = new Discharge();
    const card3 = new Oblivion();

    expect(cardGroup.types).toEqual([]);

    cardGroup.addCardToBottom(card1);
    cardGroup.addCardToBottom(card2);
    cardGroup.addCardToBottom(card3);

    expect(cardGroup.types).toEqual([
      CryptozShared.ECardType.SPARK,
      CryptozShared.ECardType.SPARK,
      CryptozShared.ECardType.SPARK,
    ]);
  });
});
