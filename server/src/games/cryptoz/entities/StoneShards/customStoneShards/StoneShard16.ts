import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { DamageModifier } from '@/games/cryptoz/customModifiers/DamageModifier';
import { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';

import type { Player } from '../../Players/Player';
import type { AbstractCard } from '../../Cards/AbstractCard';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard16 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 16, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard16.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => Promise.resolve(true);

  protected onChangeOwner = (prevOwner: Player | null) => {
    if (prevOwner) {
      prevOwner.modifiersDamageToSelf.removeModifierById(this.readableId);
      prevOwner.modifiersCountSeals.removeModifierById(this.readableId);
    }

    if (!this.owner) {
      return;
    }
    this.owner.modifiersDamageToSelf
      .addModifier(new DamageModifier(this.readableId, (currentValue: number, card: AbstractCard) => {
        if (card.id === CryptozShared.ECardId.DISCHARGE) {
          return currentValue + 3;
        }
        return currentValue;
      }));
    this.owner.modifiersCountSeals.addModifier(
      new CountSealsModifier(this.readableId, (currentValue: number) => currentValue + 1),
    );
  };
}
