import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class Discharge extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DISCHARGE,
      target: CryptozShared.ECardTarget.PLAYER,
      type: CryptozShared.ECardType.SPARK,
      name: t('cryptoz.cards.discharge.name', 'ru'),
      price: 0,
      baseEssence: 1,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.discharge.description.strike', 'ru', {
      count: this.getDamage(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(1, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    concreteDamage,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const target = concreteTarget ?? await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players,
      title: t('cryptoz.modals.title.chooseStrikeTarget', 'ru'),
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    const damage = concreteDamage ?? this.getDamage(1, isForChaos ? null : player, target);
    this.logger.debug(`Урон: ${damage}`);

    if (!damage) {
      return true;
    }

    if (target !== player && canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: isForChaos ? undefined : player,
        cardAttack: this,
        damage,
        title: isForChaos
          ? t('cryptoz.modals.title.willYouEvadeWithDamage', 'ru', {
              count: damage,
            })
          : t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
              nickname: player.nickname,
              count: damage,
            }),
      });
      this.logger.debug(`Попытка укрытия: ${isEvaded}`);

      if (isEvaded) {
        return true;
      }
    }

    if (isForChaos) {
      target.takeDamage(damage);
      return true;
    }

    const isKilled = player.attack(target, damage);
    this.logger.debug(`Убил: ${isKilled}`);

    if (isKilled && !isForChaos) {
      player.takeCards(2);
    }

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
