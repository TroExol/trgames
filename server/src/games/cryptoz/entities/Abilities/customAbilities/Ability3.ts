import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { HandFilledOnTurnEndTrigger } from '@/games/cryptoz/customTriggers/HandFilledOnTurnEndTrigger';
import { CardTookTrigger } from '@/games/cryptoz/customTriggers/CardTookTrigger';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability3 extends AbstractAbility {
  private tookWickednessOnTurn = 0;

  constructor(room?: Room) {
    super({ id: 3, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability3.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    this.tookWickednessOnTurn = 0;

    prevOwner?.triggersOnCardBought.removeTriggerById(this.readableId);
    prevOwner?.triggersOnCardTook.removeTriggerById(this.readableId);
    prevOwner?.triggersOnTurnEnded.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardTook.addTrigger(new CardTookTrigger(this.readableId, (_, card, __, prevOwnerNickname) => {
      if (
        !card.theSameType(CryptozShared.ECardType.WICKEDNESS)
        || card.owner !== this.owner
        || !this.owner?.isActive
        || this.ownerNickname === prevOwnerNickname
      ) {
        return;
      }
      this.tookWickednessOnTurn++;
    }));
    newOwner?.triggersOnCardBought.addTrigger(new CardBoughtTrigger(this.readableId, card => {
      if (
        !card.theSameType(CryptozShared.ECardType.WICKEDNESS)
        || !this.owner?.isActive
      ) {
        return;
      }
      this.tookWickednessOnTurn++;
    }));
    newOwner?.triggersOnHandFilledOnTurnEnd.addTrigger(new HandFilledOnTurnEndTrigger(this.readableId, () => {
      this.owner?.takeCards(this.tookWickednessOnTurn);
      this.tookWickednessOnTurn = 0;
    }, { order: 1 }));
  };
}
