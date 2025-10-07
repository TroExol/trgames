import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class GrimCleaver extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.GRIM_CLEAVER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.grimCleaver.name', 'ru'),
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
    }),
    strike: t('cryptoz.cards.grimCleaver.description.strike', 'ru', {
      count: this.getDamage(5, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    if (isForChaos) {
      return Promise.resolve(false);
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async (params: TCardPlayStrikeHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
      concreteDamage,
      concreteTarget,
      canEvade,
    } = params;

    if (isForChaos) {
      return false;
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает мракобой ${player?.nickname}`);

    if (!player) {
      return false;
    }

    // Получаем участников слева и справа
    const leftPlayer = this.room.players.getLeftPlayer(player);
    let rightPlayer = this.room.players.getRightPlayer(player);

    if (!concreteTarget && !leftPlayer && !rightPlayer) {
      return false;
    }

    if (rightPlayer && leftPlayer?.theSame(rightPlayer)) {
      rightPlayer = null;
    }

    const targets = concreteTarget ? [concreteTarget] : [leftPlayer, rightPlayer];

    await Promise.allSettled(targets.map(async target => {
      if (!target) {
        return;
      }
      const damage = concreteDamage ?? this.getDamage(5, isForChaos ? null : player, target);
      this.logger.debug(`Урон: ${damage}`);

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: isForChaos ? undefined : player,
          cardAttack: this,
          damage,
          title: isForChaos
            ? `Тебя атакуют на ${damage} урона, будешь укрываться?`
            : `Участник ${player.nickname} собирается нанести тебе ${damage} урона, будешь укрываться?`,
        });

        if (isEvaded) {
          return;
        }
      }

      if (isForChaos) {
        target.takeDamage(damage);
      } else {
        player.attack(target, damage);
      }
    }));

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
