import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosC extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_C,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosC.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosC.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTargets,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;
    const cards = new CardGroup(ECardGroupType.ANY);

    for (const player of targets.array) {
      if (canEvade) {
        const isEvaded = await player.tryEvade({
          cardAttack: this,
          title: t('cryptoz.modals.title.willYouEvade', 'ru'),
        });

        if (isEvaded) {
          continue;
        }
      }

      if (player.deck.count === 0) {
        player.fillDeck();
      }

      const topCard = player.deck.top;
      if (topCard) {
        cards.addCardToBottom(topCard);
      }
    }

    if (cards.count === 0) {
      return Promise.resolve(true);
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers,
      cards,
      cardsSubtitle: cards.array.reduce<Record<string, string>>((acc, card) => ({
        ...acc,
        [card.readableId]: card.ownerNickname!,
      }), {}),
      title: t('cryptoz.modals.title.showCardsFromTopDeckPlayers', 'ru', {
        count: 1,
      }),
    });

    const expensiveCards = cards.getMaxPriceCards(true);
    const cheapCards = cards.getMinPriceCards(true);

    if (expensiveCards.top?.basePrice === cheapCards.top?.basePrice) {
      return Promise.resolve(true);
    }

    expensiveCards.array.forEach(card => {
      const newOwner = cheapCards.randomCard?.owner;

      if (newOwner && card.owner) {
        newOwner.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [card]), card.owner.deck);
      }
    });

    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
