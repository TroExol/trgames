import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard13 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 13, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard13.description', 'ru');

  public canPlayHandler = () => !!this.owner?.deck.count;

  protected playHandler = () => {
    const owner = this.owner;
    if (!owner) {
      return Promise.resolve(false);
    }

    owner.takeCards(1);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
