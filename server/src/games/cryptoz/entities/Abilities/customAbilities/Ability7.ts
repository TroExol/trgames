import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability7 extends AbstractAbility {
  private readonly playedCreaturesOnTurn = new Set<string>();
  private readonly playedWickednessOnTurn = new Set<string>();

  constructor(room?: Room) {
    super({ id: 7, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability7.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    this.playedCreaturesOnTurn.clear();
    this.playedWickednessOnTurn.clear();

    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    prevOwner?.triggersOnTurnEnded.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, card => {
      if (
        !this.owner
        || card.owner !== this.owner
        || ![CryptozShared.ECardType.CREATURE, CryptozShared.ECardType.WICKEDNESS].includes(card.type)
        || this.playedCreaturesOnTurn.has(card.uuid)
        || this.playedWickednessOnTurn.has(card.uuid)
      ) {
        return;
      }

      switch (card.type) {
        case CryptozShared.ECardType.CREATURE:
          this.playedCreaturesOnTurn.add(card.uuid);
          if (this.playedCreaturesOnTurn.size === 2) {
            this.owner.addEssenceOnTurn(2);
          }
          break;
        case CryptozShared.ECardType.WICKEDNESS:
          this.playedWickednessOnTurn.add(card.uuid);
          if (this.playedWickednessOnTurn.size === 2) {
            this.owner.addEssenceOnTurn(2);
          }
          break;
        default:
          return;
      }
    }));
    newOwner?.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.playedCreaturesOnTurn.clear();
      this.playedWickednessOnTurn.clear();
    }));
  };
}
