import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';
import { CanEvadeModifier } from '@/games/cryptoz/customModifiers/CanEvadeModifier';

import type { Player } from '../../Players/Player';
import type { AbstractCard } from '../../Cards/AbstractCard';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard17 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 17, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard17.description', 'ru');

  public canPlayHandler = () => true;

  protected playHandler = () => Promise.resolve(true);

  protected onChangeOwner = (prevOwner: Player | null) => {
    if (prevOwner) {
      prevOwner.modifiersCanEvade.removeModifierById(this.readableId);
      prevOwner.modifiersCountSeals.removeModifierById(this.readableId);
    }

    if (!this.owner) {
      return;
    }
    this.owner.modifiersCanEvade
      .addModifier(new CanEvadeModifier(this.readableId, (currentValue: boolean, card: AbstractCard) => {
        if (card.type === CryptozShared.ECardType.CHAOS) {
          return false;
        }
        return currentValue;
      }));
    this.owner.modifiersCountSeals.addModifier(
      new CountSealsModifier(this.readableId, (currentValue: number) => currentValue + 1),
    );
  };
}
