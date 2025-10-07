import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability8 extends AbstractAbility {
  constructor(room?: Room) {
    super({ id: 8, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability8.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    prevOwner?.triggersOnCardBought.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardBought.addTrigger(new CardBoughtTrigger(this.readableId, (card, price, boughtFrom) => {
      if (
        !this.owner
        || card.owner !== this.owner
        || price > 4
        || boughtFrom !== 'market'
      ) {
        return;
      }

      if (this.owner.discard.removeCard(card)) {
        this.owner.deck.addCardToTop(card);
      }
    }));
  };
}
