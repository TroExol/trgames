import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class FruitCaster extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.FRUIT_CASTER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.fruitCaster.name', 'ru'),
      price: 9,
      baseEssence: 2,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.fruitCaster.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.fruitCaster.description.totalStrike', 'ru', {
      count: this.getDamage(5, null, undefined),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));

    const totalSparks = player.allCards.getCardsByType(CryptozShared.ECardType.SPARK).count;

    if (totalSparks > 0) {
      player.heal(totalSparks);
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => !!this.room.cursedSeals.count;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    const targets = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(targets.array.map(async targetPlayer => {
      const damage = this.getDamage(5, null, targetPlayer);

      if (!damage) {
        return;
      }

      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        damage,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (isEvaded) {
        return;
      }

      targetPlayer.takeDamage(damage);
      targetPlayer.takeCardsToDiscard(1, this.room.cursedSeals);
    }));

    return Promise.resolve(true);
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
