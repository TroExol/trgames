import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosJ extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_J,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosJ.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosJ.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ concreteTargets }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    await Promise.allSettled(targets.array.map(async player => {
      if (this.room.deck.count === 0) {
        return;
      }

      const variant = await this.room.socketService.selectVariant({
        player,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.take', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.refuse', 'ru') },
        ],
        title: t('cryptoz.cards.chaosJ.modals.title.chooseVariant', 'ru'),
      });

      if (variant !== 1) {
        return;
      }

      const cardFromDeck = this.room.deck.top;
      if (cardFromDeck) {
        player.takeCardsToHand(new CardGroup(ECardGroupType.ANY, [cardFromDeck]), this.room.deck);
      } else {
        return;
      }

      if (!player.deck.count) {
        player.fillDeck();
      }

      const cardToDestroy = player.deck.top;
      if (cardToDestroy) {
        player.removeCards(new CardGroup(ECardGroupType.ANY, [cardToDestroy]), 'deck');
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
