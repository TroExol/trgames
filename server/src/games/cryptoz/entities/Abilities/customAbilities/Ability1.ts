import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability1 extends AbstractAbility {
  private playedArtifactsOnTurn = 0;

  constructor(room?: Room) {
    super({ id: 1, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability1.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    this.playedArtifactsOnTurn = 0;

    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    prevOwner?.triggersOnTurnEnded.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, async card => {
      if (!card.theSameType(CryptozShared.ECardType.ARTIFACT) || !this.owner) {
        return;
      }

      this.playedArtifactsOnTurn++;

      if (this.playedArtifactsOnTurn !== 2) {
        return;
      }

      const selected = await this.room.socketService.selectCards({
        player: this.owner,
        cards: this.owner.discard,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.put', 'ru') }],
        title: t('cryptoz.modals.title.mayPutCardFromDiscardToSelfTopDeck', 'ru'),
      });
      if (!selected.cards.count) {
        return;
      }
      this.owner.takeCardsToDeck(selected.cards, this.owner.discard);
    }));
    newOwner?.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.playedArtifactsOnTurn = 0;
    }));
  };
}
