import type { CryptozShared } from '@trgames/shared';

import _ from 'lodash';

import type { AbstractCard } from '../AbstractCard';

import { ECardGroupType } from './types';

export class CardGroup<T extends ECardGroupType> {
  public array: AbstractCard[] = [];
  public readonly type: ECardGroupType;

  constructor(type: T, cards?: AbstractCard[]) {
    this.type = type;
    if (cards) {
      this.array = cards;
    }
  }

  public clone = (): CardGroup<T> => {
    return new CardGroup(this.type, [...this.array]);
  };

  public shuffle = (): void => {
    this.array = _.shuffle(this.array);
  };

  public toShuffle = (): CardGroup<T> => {
    return new CardGroup(this.type, _.shuffle(this.array));
  };

  public getCard = (card: AbstractCard): AbstractCard | null => {
    return _.find(this.array, card) ?? null;
  };

  public getCardById = (id: CryptozShared.ECardId): AbstractCard | null => {
    return _.find(this.array, ['id', id]) ?? null;
  };

  public getCardByUuid = (uuid: string): AbstractCard | null => {
    return _.find(this.array, ['uuid', uuid]) ?? null;
  };

  public getCardByType = (type: CryptozShared.ECardType): AbstractCard | null => {
    return _.find(this.array, ['type', type]) ?? null;
  };

  public getCards = (card: AbstractCard): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.filter(this.array, card));
  };

  public getCardsFromTop = (count: number): CardGroup<ECardGroupType.ANY> => {
    if (count <= 0) {
      return new CardGroup(ECardGroupType.ANY, []);
    }
    return new CardGroup(ECardGroupType.ANY, this.array.slice(-count));
  };

  public getCardsFromBottom = (count: number): CardGroup<ECardGroupType.ANY> => {
    if (count <= 0) {
      return new CardGroup(ECardGroupType.ANY, []);
    }
    return new CardGroup(ECardGroupType.ANY, this.array.slice(0, count));
  };

  public getCardsByType = (type: CryptozShared.ECardType): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.filter(this.array, ['type', type]));
  };

  public getCardsById = (id: CryptozShared.ECardId): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.filter(this.array, ['id', id]));
  };

  public getCountCardsById = (id: CryptozShared.ECardId): number => {
    return this.getCardsById(id).count;
  };

  public getCountCardsByType = (type: CryptozShared.ECardType): number => {
    return this.getCardsByType(type).count;
  };

  public getCountCards = (card: AbstractCard): number => {
    return this.getCards(card).count;
  };

  public addCardToBottom = (card: AbstractCard): void => {
    this.array.unshift(card);
  };

  public addCardToTop = (card: AbstractCard): void => {
    this.array.push(card);
  };

  public addCardToRandomPlace = (card: AbstractCard): void => {
    this.array.splice(_.random(0, this.count), 0, card);
  };

  public removeCard = (card: AbstractCard): AbstractCard | null => {
    return _.remove(this.array, card)[0] ?? null;
  };

  public removeCardsById = (id: CryptozShared.ECardId): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.remove(this.array, ['id', id]));
  };

  public removeCardsByType = (type: CryptozShared.ECardType): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.remove(this.array, ['type', type]));
  };

  public removeCardsFromTop = (count: number): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, this.array.splice(-count));
  };

  public removeCardsFromBottom = (count: number): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, this.array.splice(0, count));
  };

  public getCardsExceptCard = (card: AbstractCard): CardGroup<ECardGroupType.ANY> => {
    return new CardGroup(ECardGroupType.ANY, _.without(this.array, card));
  };

  public clear = (): void => {
    this.array = [];
  };

  public getMaxPriceCards(compareBasePrice = true): CardGroup<ECardGroupType.ANY> {
    const cards = this.array.reduce<[AbstractCard[], number]>((acc, card) => {
      const price = compareBasePrice ? card.basePrice : card.getPrice(card.owner);
      if (price === acc[1]) {
        acc[0].push(card);
      } else if (price > acc[1]) {
        acc[0] = [card];
        acc[1] = price;
      }
      return acc;
    }, [[], 0])[0];
    return new CardGroup(ECardGroupType.ANY, cards);
  }

  public getMinPriceCards(compareBasePrice = true): CardGroup<ECardGroupType.ANY> {
    const cards = this.array.reduce<[AbstractCard[], number]>((acc, card) => {
      const price = compareBasePrice ? card.basePrice : card.getPrice(card.owner);
      if (price === acc[1]) {
        acc[0].push(card);
      } else if (price < acc[1]) {
        acc[0] = [card];
        acc[1] = price;
      }
      return acc;
    }, [[], 999])[0];
    return new CardGroup(ECardGroupType.ANY, cards);
  }

  public get randomCard(): AbstractCard | null {
    return _.sample(this.array) ?? null;
  };

  public get top(): AbstractCard | null {
    return _.last(this.array) ?? null;
  }

  public get bottom(): AbstractCard | null {
    return _.first(this.array) ?? null;
  }

  public get ids(): CryptozShared.ECardId[] {
    return _.map(this.array, 'id');
  }

  public get types(): CryptozShared.ECardType[] {
    return _.map(this.array, 'type');
  }

  public get count(): number {
    return this.array.length;
  }
}
