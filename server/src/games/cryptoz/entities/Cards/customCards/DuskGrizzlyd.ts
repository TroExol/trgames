import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class DuskGrizzlyd extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DUSK_GRIZZLYD,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.duskGrizzlyd.name', 'ru'),
      price: 5,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }) + '. ' + t('cryptoz.cards.descriptions.heal', 'ru', {
      count: this.getHeal(2, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.duskGrizzlyd.description.strike', 'ru', {
      count: this.getDamage(5, isSimple ? null : this.owner, undefined),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
    player.heal(this.getHeal(2, player));
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    concreteDamage,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    if (isForChaos) {
      return false;
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const targets = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : this.room.players.getPlayersExceptPlayer(player);

    // Фильтруем только противников с меньшим здоровьем
    const validTargets = targets.array.filter(target => target.health < player.health);

    if (validTargets.length === 0) {
      this.logger.debug('Нет подходящих целей для атаки');
      return true;
    }

    await Promise.allSettled(validTargets.map(async target => {
      const damage = concreteDamage ?? this.getDamage(5, player, target);

      if (!damage) {
        return;
      }

      this.logger.debug(`Урон: ${damage} для цели ${target.nickname}`);

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: player,
          cardAttack: this,
          damage,
          title: t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
            nickname: player.nickname,
            count: damage,
          }),
        });
        this.logger.debug(`Попытка укрытия: ${isEvaded}`);

        if (isEvaded) {
          return;
        }
      }

      player.attack(target, damage);
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
