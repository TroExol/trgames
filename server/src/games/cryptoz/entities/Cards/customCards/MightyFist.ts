import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class MightyFist extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.MIGHTY_FIST,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.mightyFist.name', 'ru'),
      price: 4,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.takeCardsFromHand', 'ru', {
      count: 1,
    }),
    strike: t('cryptoz.cards.mightyFist.description.strike', 'ru', {
      count: this.getDamage(6, isSimple ? null : this.owner),
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

    player.takeCards(1);

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async (params: TCardPlayStrikeHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
      concreteTarget,
      concreteDamage,
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

    const targets = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : new PlayerGroup();

    if (!targets.count) {
      const leftPlayer = this.room.players.getLeftPlayer(player);
      if (!leftPlayer) {
        return false;
      }
      targets.addPlayerToBottom(leftPlayer);
      const rightPlayer = this.room.players.getRightPlayer(player);
      if (rightPlayer && !rightPlayer.theSame(leftPlayer)) {
        targets.addPlayerToBottom(rightPlayer);
      }
    }
    if (!targets.count) {
      return false;
    }

    const target = await this.room.socketService.selectTarget({
      player,
      targetsToSelect: targets,
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    const damage = concreteDamage ?? this.getDamage(6, isForChaos ? null : player, target);
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

    player.attack(target, damage);

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
