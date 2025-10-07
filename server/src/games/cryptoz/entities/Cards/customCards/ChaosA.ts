import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosA extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_A,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosA.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosA.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, concreteTargets }: TCardPlayGeneralHandlerParams) => {
    if (!tempPlayer) {
      return false;
    }

    const targets = concreteTargets ?? this.room.players;

    await Promise.allSettled(targets.array.map(async player => {
      const variant = await this.room.socketService.selectVariant({
        player,
        variants: [
          { id: 1, value: t('cryptoz.cards.chaosA.modals.title.discardHandAndTakeCards', 'ru') },
          { id: 2, value: t('cryptoz.cards.chaosA.modals.title.takeCursedSeal', 'ru') },
        ],
        title: t('cryptoz.modals.title.chooseChaosAction', 'ru'),
      });

      if (variant === 1) {
        player.discardHand(player.hand);
        player.takeCards(2);
      } else if (variant === 2) {
        player.takeCardsToDiscard(1, this.room.cursedSeals);
      }
    }));

    return true;
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
