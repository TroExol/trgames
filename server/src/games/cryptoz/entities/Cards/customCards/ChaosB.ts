import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosB extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_B,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosB.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosB.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTargets,
    concreteDamage,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    const targets = concreteTargets ?? this.room.players.maxHpPlayers;

    await Promise.allSettled(targets.array.map(async target => {
      const damage = concreteDamage ?? this.getDamage(6, null, target);

      if (!damage) {
        return true;
      }

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          cardAttack: this,
          damage,
          title: t('cryptoz.modals.title.willYouEvade', 'ru', {
            damage,
          }),
        });

        if (isEvaded) {
          return true;
        }
      }

      target.takeDamage(damage);
    }));

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
