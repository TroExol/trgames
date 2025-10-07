import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PriceModifier } from '@/games/cryptoz/customModifiers/PriceModifier';
import { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';

import type { Player } from '../../Players/Player';
import type { AbstractCard } from '../../Cards/AbstractCard';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard18 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 18, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard18.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => Promise.resolve(true);

  protected onChangeOwner = (prevOwner: Player | null) => {
    if (prevOwner) {
      prevOwner.modifiersPrice.removeModifierById(this.readableId);
      prevOwner.modifiersCountSeals.removeModifierById(this.readableId);
    }

    if (!this.owner) {
      return;
    }
    this.owner.modifiersPrice
      .addModifier(new PriceModifier(this.readableId, (currentValue: number, card: AbstractCard) => {
        if (card.type === CryptozShared.ECardType.HARBINGER || card.id === CryptozShared.ECardId.DARKNESS_MADNESS) {
          return currentValue + 1;
        }
        return currentValue;
      }));
    this.owner.modifiersCountSeals.addModifier(
      new CountSealsModifier(this.readableId, (currentValue: number) => currentValue + 1),
    );
  };
}
