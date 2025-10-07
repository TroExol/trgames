import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type {
  TCardEvadeHandlerParams,
  TCardPlayGeneralHandlerParams,
  TCardPlayStrikeHandlerParams,
} from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class FlamingKeeperOfTheGlens extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.FLAMING_KEEPER_OF_THE_GLENS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.flamingKeeperOfTheGlens.name', 'ru'),
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
    }),
    strike: t('cryptoz.cards.flamingKeeperOfTheGlens.description.strike', 'ru', {
      count: this.getDamage(2, isSimple ? null : this.owner, undefined),
    }),
    evade: t('cryptoz.cards.flamingKeeperOfTheGlens.description.evade', 'ru'),
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

  public canPlayStrikeHandler = ({ tempPlayer }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player) {
      return false;
    }
    return !!new CardGroup(ECardGroupType.ANY, [...player.discard.array, ...player.arena.array])
      .getCountCardsByType(CryptozShared.ECardType.WICKEDNESS);
  };

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    concreteDamage,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player || isForChaos) {
      return false;
    }

    const countCreatures = new CardGroup(ECardGroupType.ANY, [...player.discard.array, ...player.arena.array])
      .getCountCardsByType(CryptozShared.ECardType.WICKEDNESS);
    const targets = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : this.room.players.getPlayersExceptPlayer(player);

    await Promise.allSettled(targets.array.map(async target => {
      const damage = concreteDamage ?? this.getDamage(countCreatures * 2, player, target);
      this.logger.debug(`Цель: ${target.nickname}`);
      this.logger.debug(`Урон: ${damage}`);

      if (!damage) {
        return true;
      }

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: player,
          cardAttack: this,
          damage,
          title: t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
            nickname: player.nickname,
            damage,
          }),
        });
        this.logger.debug(`Попытка укрытия: ${isEvaded}`);

        if (isEvaded) {
          return;
        }
      }

      player.attack(target, damage);
    }));

    return true;
  };

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
    return true;
  };
}
