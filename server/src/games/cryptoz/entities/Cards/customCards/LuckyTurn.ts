import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class LuckyTurn extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.LUCKY_TURN,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.luckyTurn.name', 'ru'),
      price: 3,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.takeCardsFromHand', 'ru', {
      count: 1,
    }),
    evade: t('cryptoz.cards.luckyTurn.description.evade', 'ru', {
      count: this.getHeal(3, isSimple ? null : this.owner),
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

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = () => {
    if (!this.owner) {
      return Promise.resolve(false);
    }

    this.logger.debug(`Разыгрывает укрытие ${this.ownerNickname}`);
    this.owner.takeCards(1);
    this.owner.heal(this.getHeal(3, this.owner));

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);
}
