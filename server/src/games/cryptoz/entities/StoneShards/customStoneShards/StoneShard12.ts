import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard12 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 12, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard12.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => {
    const owner = this.owner;
    if (!owner) {
      return Promise.resolve(false);
    }

    owner.health = 11;
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
