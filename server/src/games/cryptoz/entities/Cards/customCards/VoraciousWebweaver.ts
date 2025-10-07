import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class VoraciousWebweaver extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.VORACIOUS_WEBWEAVER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.voraciousWebweaver.name', 'ru'),
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
    strike: t('cryptoz.cards.voraciousWebweaver.description.strike', 'ru', {
      count: this.getDamage(2, isSimple ? null : this.owner, undefined),
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
    if (isForChaos) {
      return false;
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const targets = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : this.room.players.getPlayersExceptPlayer(player);

    let isSomeoneDamaged = false;

    const countCursedSeals = player.arena.getCardsByType(CryptozShared.ECardType.CURSED_SEAL).count
      + player.discard.getCardsByType(CryptozShared.ECardType.CURSED_SEAL).count;

    await Promise.allSettled(targets.array.map(async target => {
      const damage = concreteDamage ?? this.getDamage(2 * countCursedSeals, player, target);

      if (!damage) {
        return;
      }

      this.logger.debug(`Урон: ${damage} для цели ${target.nickname}`);

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: player,
          cardAttack: this,
          damage,
          title: t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
            count: damage,
            player: player.nickname,
          }),
        });
        this.logger.debug(`Попытка укрытия: ${isEvaded}`);

        if (isEvaded) {
          return;
        }
      }

      player.attack(target, damage);
      isSomeoneDamaged = true;
    }));

    if (!isSomeoneDamaged) {
      player.takeCards(1);
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
