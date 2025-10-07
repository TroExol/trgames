import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability2 extends AbstractAbility {
  constructor(room?: Room) {
    super({ id: 2, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability2.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    newOwner?.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, card => {
      if (card.theSameType(CryptozShared.ECardType.CREATURE)) {
        this.owner?.heal(card.getGloryShards(newOwner));
      }
    }));
  };
}
