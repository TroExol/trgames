import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type {
  TCardPlayGeneralHandlerParams,
  TCardPlayStrikeHandlerParams,
  TCardPlayTotalDarknessStrikeHandlerParams,
} from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class SorceressOfAgony extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.SORCERESS_OF_AGONY,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.sorceressOfAgony.name', 'ru'),
      price: 12,
      baseEssence: 0,
      gloryShards: 6,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(4, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.descriptions.dealDamage', 'ru', {
      count: this.getDamage(4, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.sorceressOfAgony.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(4, player));
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    tempPlayer,
    concreteTarget,
    concreteDamage,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;

    if (!player) {
      return false;
    }

    const targets = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : this.room.players.getPlayersExceptPlayer(player);

    const target = await this.room.socketService.selectTarget({
      player,
      targetsToSelect: targets,
    });

    if (!target) {
      return true;
    }

    const damage = concreteDamage ?? this.getDamage(4, isForChaos ? null : player, target);

    if (canEvade) {
      const isEvaded = await target.tryEvade({
        cardAttack: this,
        attacker: isForChaos ? undefined : player,
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
    } else {
      player.attack(target, damage);
    }

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    const playersToAttack = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(playersToAttack.array.map(async (targetPlayer: Player) => {
      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (isEvaded) {
        return;
      }

      const cardsMoreExpensiveThan4 = targetPlayer.hand.array.filter(card => card.getPrice(null) >= 4);

      targetPlayer.takeCardsToDiscard(
        new CardGroup(ECardGroupType.ANY, cardsMoreExpensiveThan4),
        targetPlayer.hand,
      );
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
