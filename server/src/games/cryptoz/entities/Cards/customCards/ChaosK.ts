import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosK extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_K,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosK.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosK.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ concreteTargets }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    const destroyedCards: AbstractCard[] = [];
    const cardsSubtitle: Record<string, string> = {};

    await Promise.allSettled(targets.array.map(async player => {
      if (!player.hand.count) {
        return;
      }

      const mostExpensiveCards = player.hand.getMaxPriceCards(true);

      const { variant } = await this.room.socketService.selectCards({
        player,
        cards: mostExpensiveCards,
        count: mostExpensiveCards.count,
        variants: [
          { id: 1, value: t('cryptoz.cards.chaosK.modals.variants.destroyAndRestoreHealth', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.refuse', 'ru') },
        ],
        title: t('cryptoz.cards.chaosK.modals.title.chooseVariant', 'ru', {
          count: mostExpensiveCards.count,
        }),
      });

      if (variant !== 1) {
        return;
      }

      const cardToDestroy = mostExpensiveCards.randomCard;
      if (!cardToDestroy) {
        return;
      }

      destroyedCards.push(cardToDestroy);
      cardsSubtitle[cardToDestroy.readableId] = t('cryptoz.modals.subtitle.cardOwner', 'ru', {
        nickname: player.nickname,
      });

      player.removeCards(new CardGroup(ECardGroupType.ANY, [cardToDestroy]), 'hand');
      player.heal(13);
    }));

    if (destroyedCards.length) {
      this.room.socketService.showEntities({
        players: this.room.playersAndViewers,
        cards: new CardGroup(ECardGroupType.ANY, destroyedCards),
        cardsSubtitle,
        title: t('cryptoz.modals.title.randomDestroyedCards', 'ru'),
      });
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
