import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class DreadOneEyedWarrior extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DREAD_ONE_EYED_WARRIOR,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.dreadOneEyedWarrior.name', 'ru'),
      price: 8,
      baseEssence: 1,
      gloryShards: 4,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }) + '. ' + t('cryptoz.cards.dreadOneEyedWarrior.description.general', 'ru', {
      count: this.getDamage(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (player && !isForChaos) {
      player.addEssenceOnTurn(this.getEssence(1, player));
      player.takeCards(1);
    }

    const targets = player && !isForChaos
      ? this.room.players.getPlayersExceptPlayer(player)
      : this.room.players;

    targets.array.forEach(target => {
      const damage = this.getDamage(1, isForChaos ? null : player, target);
      if (isForChaos) {
        target.takeDamage(damage);
      } else {
        player?.attack(target, damage);
      }
    });

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
