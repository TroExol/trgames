import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class RatMarauders extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.RAT_MARAUDERS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.ratMarauders.name', 'ru'),
      price: 4,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.ratMarauders.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async ({ attacker }: TCardEvadeHandlerParams) => {
    if (!attacker) {
      return true;
    }

    if (!this.owner) {
      return false;
    }

    const { cards, variant } = await this.room.socketService.selectCards({
      player: this.owner,
      cards: new CardGroup(ECardGroupType.ANY, [...this.owner.hand.array, ...this.owner.discard.array]),
      cardsSubtitle: Object.fromEntries([
        ...this.owner.hand.array.map(card => [card.readableId, t('cryptoz.cards.places.hand', 'ru')] as const),
        ...this.owner.discard.array.map(card => [card.readableId, t('cryptoz.cards.places.discard', 'ru')] as const),
      ]),
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.give', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.cards.ratMarauders.modals.title.giveCardToAnotherPlayer', 'ru', {
        attackerNickname: attacker.nickname,
      }),
    });

    if (!cards.top || variant === 2) {
      return true;
    }

    const selectedCard = cards.top;

    const isFromHand = !!this.owner.hand.getCard(selectedCard);
    const isFromDiscard = !!this.owner.discard.getCard(selectedCard);

    if (isFromDiscard) {
      attacker.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [selectedCard]), this.owner.discard);
    } else if (isFromHand) {
      attacker.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [selectedCard]), this.owner.hand);
    }

    return true;
  };
}
