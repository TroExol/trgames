import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard2 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 2, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard2.description', 'ru');

  public canPlayHandler = () => !!this.owner?.hand.count;

  protected playHandler = () => {
    const randomCards = this.owner?.hand.toShuffle().getCardsFromTop(2);
    if (randomCards && this.owner) {
      this.owner.discardHand(randomCards);
    }
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
