import type { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability6 extends AbstractAbility {
  private readonly playedCardTypesOnTurn = new Set<CryptozShared.ECardType>();

  constructor(room?: Room) {
    super({ id: 6, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability6.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    this.playedCardTypesOnTurn.clear();

    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    prevOwner?.triggersOnTurnEnded.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, card => {
      if (!this.owner || card.owner !== this.owner || this.playedCardTypesOnTurn.has(card.type)) {
        return;
      }

      this.playedCardTypesOnTurn.add(card.type);

      if (this.playedCardTypesOnTurn.size !== 4) {
        return;
      }

      this.owner.addEssenceOnTurn(1);
      this.owner.takeCards(1);
    }));
    newOwner?.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.playedCardTypesOnTurn.clear();
    }));
  };
}
