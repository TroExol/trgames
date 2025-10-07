import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosS extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_S,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosS.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosS.description.strike', 'ru'),
  });

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    tempPlayer,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.room.activePlayer;

    if (!player) {
      return Promise.resolve(false);
    }

    const rightPlayer = this.room.players.getRightPlayer(player);
    if (!rightPlayer) {
      return Promise.resolve(false);
    }

    if (canEvade) {
      const isEvaded = await player.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvade', 'ru'),
      });

      if (isEvaded) {
        return Promise.resolve(true);
      }
    }

    if (rightPlayer.hand.count) {
      const { cards, variant } = await this.room.socketService.selectCards({
        player: rightPlayer,
        cards: rightPlayer.hand,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
        ],
        title: t('cryptoz.modals.title.mayRemoveCardsFromHand', 'ru', {
          count: rightPlayer.hand.count,
        }),
      });

      if (cards.count && variant === 1) {
        rightPlayer.removeCards(cards, 'hand');
      }
    }

    if (rightPlayer.discard.count) {
      const { cards, variant } = await this.room.socketService.selectCards({
        player: rightPlayer,
        cards: rightPlayer.discard,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
        ],
        title: t('cryptoz.modals.title.mayRemoveCardsFromDiscard', 'ru', {
          count: rightPlayer.discard.count,
        }),
      });

      if (cards.count && variant === 1) {
        rightPlayer.removeCards(cards, 'discard');
      }
    }

    return Promise.resolve(true);
  };

  public canPlayGeneralHandler = () => false;
  protected playGeneralHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
