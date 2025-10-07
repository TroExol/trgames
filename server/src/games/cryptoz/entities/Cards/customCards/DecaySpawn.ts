import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard, type TCardEvadeHandlerParams } from '../AbstractCard';

export class DecaySpawn extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DECAY_SPAWN,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.decaySpawn.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }) + '. ' + t('cryptoz.cards.descriptions.heal', 'ru', {
      count: this.getHeal(6, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.decaySpawn.description.strike', 'ru', {
      count: this.getHeal(3, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    this.logger.debug(`Разыгрывает ${player?.nickname}`);
    player.addEssenceOnTurn(this.getEssence(2, player));
    player.heal(this.getHeal(6, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async ({ attacker, cardAttack, damage }: TCardEvadeHandlerParams) => {
    if (!this.owner) {
      return false;
    }
    this.owner.takeCards(1);
    this.owner.heal(this.getHeal(3, this.owner));
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
    return true;
  };
}
