import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class IronVoice extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.IRON_VOICE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.ironVoice.name', 'ru'),
      price: 2,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.ironVoice.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(this.getEssence(1, player));
    return Promise.resolve(true);
  };

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async () => {
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
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.cards.ironVoice.modals.title.mayRemoveCardsFromHandOrDiscard', 'ru'),
    });

    const selectedCard = cards.top;

    if (!selectedCard || variant === 2) {
      return true;
    }

    const isFromHand = !!this.owner.hand.getCard(selectedCard);
    const isFromDiscard = !!this.owner.discard.getCard(selectedCard);

    if (isFromDiscard) {
      this.owner.removeCards(new CardGroup(ECardGroupType.ANY, [selectedCard]), 'discard');
    } else if (isFromHand) {
      this.owner.removeCards(new CardGroup(ECardGroupType.ANY, [selectedCard]), 'hand');
    }

    return true;
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
