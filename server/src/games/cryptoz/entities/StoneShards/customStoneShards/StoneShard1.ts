import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard1 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 1, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard1.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => {
    this.owner?.takeCardsToDiscard(2, this.room.cursedSeals);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
