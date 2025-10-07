import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard6 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 6, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard6.description', 'ru');

  public canPlayHandler = () => !!this.owner?.discard.count;

  protected playHandler = () => {
    if (!this.owner) {
      return Promise.resolve(false);
    }

    const randomCard = this.owner.discard.randomCard;
    if (!randomCard) {
      return Promise.resolve(false);
    }

    this.owner.removeCards(new CardGroup(ECardGroupType.ANY, [randomCard]), 'discard');
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
