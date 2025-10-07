import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosE extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_E,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosE.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosE.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => this.room.cursedSeals.count > 0;

  protected playStrikeHandler = async ({
    concreteTargets,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;
    const playersWithCosts: Array<{ player: Player; totalCost: number }> = [];

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

      const totalCost = player.hand.array.reduce((sum, card) => {
        return sum + card.getPrice(null);
      }, 0);

      playersWithCosts.push({ player, totalCost });
    }

    if (playersWithCosts.length === 0) {
      return Promise.resolve(true);
    }

    const maxCost = Math.max(...playersWithCosts.map(item => item.totalCost));

    const playersWithMaxCost = playersWithCosts.filter(item => item.totalCost === maxCost);

    for (const { player } of playersWithMaxCost) {
      player.takeCardsToDiscard(2, this.room.cursedSeals);
    }

    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
