import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosM extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_M,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosM.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosM.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => !!this.room.deck.count;

  protected playGeneralHandler = async ({ concreteTargets }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    await Promise.allSettled(targets.array.map(async player => {
      if (!player.hand.count && !player.discard.count) {
        return;
      }

      const { variant, cards } = await this.room.socketService.selectCards({
        player,
        cards: new CardGroup(ECardGroupType.ANY, [...player.hand.array, ...player.discard.array]),
        cardsSubtitle: Object.fromEntries([
          ...player.hand.array.map(card => [card.readableId, t('cryptoz.cards.places.hand', 'ru')] as const),
          ...player.discard.array.map(card => [card.readableId, t('cryptoz.cards.places.discard', 'ru')] as const),
        ]),
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.refuse', 'ru') },
        ],
        title: t('cryptoz.cards.chaosM.modals.title.chooseCardToDestroy', 'ru'),
      });

      const cardToDestroy = cards.top;

      if (variant !== 1 || !cardToDestroy) {
        return;
      }

      const gloryShards = cardToDestroy.getGloryShards(null);
      const isFromHand = !!player.hand.getCard(cardToDestroy);
      const isFromDiscard = !!player.discard.getCard(cardToDestroy);

      if (isFromHand) {
        player.removeCards(new CardGroup(ECardGroupType.ANY, [cardToDestroy]), 'hand');
      } else if (isFromDiscard) {
        player.removeCards(new CardGroup(ECardGroupType.ANY, [cardToDestroy]), 'discard');
      }

      if (gloryShards <= 0) {
        return;
      }

      const cardsToDraw = gloryShards * 3;
      let tookCards = 0;

      while (tookCards < cardsToDraw || !this.room.deck.count) {
        const cardFromDeck = this.room.deck.top;
        if (cardFromDeck) {
          player.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [cardFromDeck]), this.room.deck);
          tookCards++;
        }
      }
    }));

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
