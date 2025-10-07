import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class AstridisLightweaver extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.ASTRIDIS_LIGHTWEAVER,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.astridisLightweaver.name', 'ru'),
      price: 7,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.astridisLightweaver.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.descriptions.dealDamage', 'ru', {
      count: this.getDamage(10, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(this.getEssence(2, player));
    player.takeCards(1);
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
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    const damage = concreteDamage ?? this.getDamage(10, isForChaos ? null : player, target);
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
          ? t('cryptoz.modals.title.willYouEvadeWithDamage', 'ru', { count: damage })
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
    } else {
      player.attack(target, damage);
    }

    return true;
  };

  protected onChangeOwner = () => {};

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
}
