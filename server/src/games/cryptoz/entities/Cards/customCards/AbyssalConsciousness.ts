import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class AbyssalConsciousness extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.ABYSSAL_CONSCIOUSNESS,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.abyssalConsciousness.name', 'ru'),
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
    strike: t('cryptoz.cards.abyssalConsciousness.description.strike', 'ru', {
      count: 5,
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

    // Проверяем, есть ли у цели карты стоимостью 5 или больше
    const expensiveCards = target.hand.array.filter(card => card.basePrice >= 5);

    if (expensiveCards.length === 0) {
      this.logger.debug('У цели нет карт стоимостью 5 или больше');
      return true;
    }

    if (canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: isForChaos ? undefined : player,
        cardAttack: this,
        title: isForChaos
          ? t('cryptoz.modals.title.willYouEvade', 'ru')
          : t('cryptoz.cards.abyssalConsciousness.modals.title.discardOrDamage', 'ru', {
              nickname: player.nickname,
            }),
      });
      this.logger.debug(`Попытка укрытия: ${isEvaded}`);

      if (isEvaded) {
        if (isForChaos) {
          target.takeDamage(5);
        } else {
          player.attack(target, 5);
        }
        this.logger.debug(`Нанесен урон за укрытие: 5`);
        return true;
      }
    }

    const { cards } = await this.room.socketService.selectCards({
      player: target,
      cards: new CardGroup(ECardGroupType.ANY, expensiveCards),
      variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
      title: t('cryptoz.cards.abyssalConsciousness.modals.title.discardExpensiveCard', 'ru'),
    });

    if (cards.count > 0) {
      target.discardHand(cards);
    }

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
