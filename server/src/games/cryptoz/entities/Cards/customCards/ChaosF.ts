import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosF extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_F,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosF.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosF.description.strike', 'ru'),
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

    await Promise.allSettled(targets.array.map(async player => {
      if (canEvade) {
        const isEvaded = await player.tryEvade({
          cardAttack: this,
          title: t('cryptoz.modals.title.willYouEvade', 'ru'),
        });

        if (isEvaded) {
          return;
        }
      }

      if (player.deck.count < 2) {
        player.fillDeck();
      }

      if (player.deck.count < 2) {
        return;
      }

      const topCards = player.deck.getCardsFromTop(2);

      this.room.socketService.showCards({
        players: this.room.playersAndViewers,
        cards: topCards,
        title: t('cryptoz.modals.title.showCardsFromPlayerTopDeck', 'ru', {
          count: 2,
          nickname: player.nickname,
        }),
      });

      const { cards: selectedCards } = await this.room.socketService.selectCards({
        player,
        cards: topCards,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.take', 'ru') }],
        title: t('cryptoz.cards.chaosF.modals.title.chooseCardToTake', 'ru'),
      });

      const cardToTake = selectedCards.top;
      if (!cardToTake) {
        return;
      }

      const cardToDestroy = topCards.array.find(card => card !== cardToTake);
      if (!cardToDestroy) {
        return;
      }

      player.removeCards(new CardGroup(ECardGroupType.ANY, [cardToDestroy]), 'deck');
      player.takeCardsToHand(new CardGroup(ECardGroupType.ANY, [cardToTake]), player.deck);

      const damage = cardToTake.getPrice(null);
      if (damage > 0) {
        player.takeDamage(damage);
      }
    }));

    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
