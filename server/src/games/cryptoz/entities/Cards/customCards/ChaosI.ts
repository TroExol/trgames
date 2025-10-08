import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosI extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_I,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosI.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosI.description.strike', 'ru'),
  });

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTargets,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    const randomCards = new CardGroup(ECardGroupType.ANY);
    const cardsSubtitle: Record<string, string> = {};

    await Promise.allSettled(targets.array.map(async target => {
      if (canEvade) {
        const isEvaded = await target.tryEvade({
          cardAttack: this,
          title: t('cryptoz.modals.title.willYouEvade', 'ru'),
        });

        if (isEvaded) {
          return;
        }
      }

      const randomCard = target.hand.randomCard;
      if (randomCard) {
        randomCards.addCardToBottom(randomCard);
        cardsSubtitle[randomCard.readableId] = t('cryptoz.modals.subtitle.cardOwner', 'ru', {
          nickname: target.nickname,
        });
        target.removeCards(new CardGroup(ECardGroupType.ANY, [randomCard]), 'hand');
      }

      target.takeCardsToHand(1, this.room.darknessMadness);
    }));

    if (randomCards.count) {
      this.room.socketService.showEntities({
        players: this.room.playersAndViewers,
        cards: randomCards,
        cardsSubtitle,
        title: t('cryptoz.modals.title.randomDestroyedCards', 'ru'),
      });
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
