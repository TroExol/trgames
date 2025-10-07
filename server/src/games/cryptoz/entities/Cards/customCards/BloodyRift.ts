import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class BloodyRift extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.BLOODY_RIFT,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.bloodyRift.name', 'ru'),
      price: 3,
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
    }),
    strike: t('cryptoz.cards.descriptions.dealDamage', 'ru', {
      count: this.getDamage(5, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
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
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const target = concreteTarget ?? await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    const damage = concreteDamage ?? this.getDamage(5, isForChaos ? null : player, target);
    this.logger.debug(`Урон: ${damage}`);

    if (!damage) {
      return true;
    }

    if (canEvade) {
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
      return true;
    }

    player.attack(target, damage);

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
