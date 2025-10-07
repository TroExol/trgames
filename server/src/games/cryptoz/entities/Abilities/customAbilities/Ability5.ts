import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';

import { AbstractAbility } from '../AbstractAbility';

export class Ability5 extends AbstractAbility {
  constructor(room?: Room) {
    super({ id: 5, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability5.description', 'ru');

  public canPlayHandler = () => false;

  protected playHandler = () => Promise.resolve(false);

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);

    newOwner?.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, async card => {
      if (!card.theSameType(CryptozShared.ECardType.RITUAL) || !this.owner) {
        return;
      }

      if (!this.owner.deck.count) {
        this.owner.fillDeck();
      }
      if (!this.owner.deck.count) {
        return;
      }

      const topCard = this.owner.deck.top!;

      const selected = await this.room.socketService.selectCards({
        player: this.owner,
        cards: new CardGroup(ECardGroupType.ANY, [topCard]),
        variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
        title: t('cryptoz.modals.title.mayDiscardCardFromSelfTopDeck', 'ru'),
      });
      if (!selected.cards.count) {
        return;
      }
      this.owner.takeCardsToDiscard(selected.cards, this.owner.deck);
    }));
  };
}
