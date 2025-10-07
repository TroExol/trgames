import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosV extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_V,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosV.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosV.description.strike', 'ru'),
  });

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTargets,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;
    const damage = 3;
    const healthThreshold = 10;

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

      if (player.health <= healthThreshold) {
        player.takeDamage(damage);
      }
    }));

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
