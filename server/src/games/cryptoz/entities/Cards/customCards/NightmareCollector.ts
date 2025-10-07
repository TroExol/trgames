import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class NightmareCollector extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.NIGHTMARE_COLLECTOR,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.nightmareCollector.name', 'ru'),
      price: 4,
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
    strike: t('cryptoz.cards.nightmareCollector.description.strike', 'ru'),
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
      targetsToSelect: this.room.players,
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    if (target !== player && canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: isForChaos ? undefined : player,
        cardAttack: this,
        title: isForChaos
          ? t('cryptoz.modals.title.willYouEvade', 'ru')
          : t('cryptoz.modals.title.willYouEvadeFromPlayer', 'ru', {
              nickname: player.nickname,
            }),
      });
      this.logger.debug(`Попытка укрытия: ${isEvaded}`);

      if (isEvaded) {
        return true;
      }
    }

    const maxPriceCard = target.hand.getMaxPriceCards(true).top;
    this.logger.debug(`Карта с максимальной базовой ценой: ${maxPriceCard?.id}`);

    if (!maxPriceCard) {
      return true;
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers,
      cards: target.hand,
      title: t('cryptoz.modals.title.showPlayerHand', 'ru', {
        nickname: target.nickname,
      }),
    });

    const damage = concreteDamage ?? this.getDamage(maxPriceCard.basePrice, isForChaos ? null : player, target);
    this.logger.debug(`Урон: ${damage}`);

    if (!damage) {
      return true;
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
