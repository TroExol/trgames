import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard4 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 4, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard4.description', 'ru');

  public canPlayHandler = () => !!this.room.harbingers.top;

  protected playHandler = async () => {
    const topHarbinger = this.room.harbingers.top;
    if (!this.owner || !topHarbinger) {
      return false;
    }

    await topHarbinger.playTotalDarknessStrike({ target: this.owner });
    return true;
  };

  protected onChangeOwner = () => {};
}
