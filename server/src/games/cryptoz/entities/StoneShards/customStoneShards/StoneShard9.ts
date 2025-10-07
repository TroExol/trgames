import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { Player } from '../../Players/Player';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard9 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 9, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard9.description', 'ru');

  public canPlayHandler = (killer: Player | null) => !killer || !this.owner?.theSame(killer);

  protected playHandler = (killer: Player | null) => {
    const owner = this.owner;
    if (!owner || !killer) {
      return Promise.resolve(false);
    }

    killer.takeDamage(8);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
