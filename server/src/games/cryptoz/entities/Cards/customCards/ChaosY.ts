import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosY extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_Y,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosY.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosY.description.strike', 'ru'),
  });

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTargets,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

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

      target.takeCardsToDeck(1, this.room.cursedSeals);
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
