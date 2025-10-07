import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class LuciferKingOfDebauchery extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.LUCIFER_KING_OF_DEBAUCHERY,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.luciferKingOfDebauchery.name', 'ru'),
      price: 6,
      baseEssence: 0,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.luciferKingOfDebauchery.description.general', 'ru'),
    evade: t('cryptoz.cards.luciferKingOfDebauchery.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);
    if (!player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(player.countStoneShards * 2);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async ({ attacker, cardAttack, damage }: TCardEvadeHandlerParams) => {
    if (!this.owner) {
      return false;
    }
    this.owner.takeCards(1);
    if (!attacker) {
      return false;
    }
    await cardAttack.playStrike({
      concreteDamage: damage,
      concreteTarget: attacker,
      tempPlayer: this.owner,
      canEvade: false,
      force: true,
    });
    attacker.takeDamage(4);
    return true;
  };
}
