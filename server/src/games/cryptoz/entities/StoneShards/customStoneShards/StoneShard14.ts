import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { GloryShardsModifier } from '@/games/cryptoz/customModifiers/GloryShardsModifier';

import type { Player } from '../../Players/Player';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard14 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 14, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard14.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => Promise.resolve(true);

  protected onChangeOwner = (prevOwner: Player | null) => {
    if (prevOwner) {
      prevOwner.modifiersGloryShards.removeModifierById(this.readableId);
    }

    if (!this.owner) {
      return;
    }
    this.owner.modifiersGloryShards.addModifier(new GloryShardsModifier(
      this.readableId,
      (currentValue: number) => currentValue - 2,
    ));
  };
}
