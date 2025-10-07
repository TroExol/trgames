import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard10 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 10, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard10.description', 'ru');

  public canPlayHandler = () => !!this.room.cursedSeals.count;

  protected playHandler = () => {
    const owner = this.owner;
    if (!owner) {
      return Promise.resolve(false);
    }

    owner.takeCardsToDiscard(1, this.room.cursedSeals);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
