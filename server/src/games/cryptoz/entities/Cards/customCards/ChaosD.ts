import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosD extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_D,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosD.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosD.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ concreteTargets }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    await Promise.allSettled(targets.array.map(async player => {
      await this.processPlayerChoices(player);
    }));

    return true;
  };

  private async processPlayerChoices(player: Player): Promise<void> {
    while (player.health > 4 && player.hand.count > 0) {
      const variant = await this.room.socketService.selectVariant({
        player,
        variants: [
          { id: 1, value: t('cryptoz.cards.chaosD.modals.variants.damage', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.stop', 'ru') },
        ],
        title: t('cryptoz.cards.chaosD.modals.title.willYouDamageA', 'ru', {
          count: player.health,
        }) + t('cryptoz.cards.chaosD.modals.title.willYouDamageB', 'ru', {
          count: player.hand.count,
        }),
      });

      if (variant !== 1) {
        break;
      }

      player.takeDamage(4);

      const { cards } = await this.room.socketService.selectCards({
        player,
        cards: player.hand,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.remove', 'ru') }],
        title: t('cryptoz.modals.title.removeCardsFromHand', 'ru', {
          count: 1,
        }),
      });

      if (cards.count) {
        player.removeCards(cards, 'hand');
      }
    }
  }

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
