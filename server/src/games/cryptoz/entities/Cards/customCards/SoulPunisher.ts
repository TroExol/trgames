import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class SoulPunisher extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.SOUL_PUNISHER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.soulPunisher.name', 'ru'),
      price: 3,
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
    strike: t('cryptoz.cards.soulPunisher.description.strike', 'ru', {
      count: this.getDamage(4, isSimple ? null : this.owner),
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
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    let target: Player | undefined | null = concreteTarget;

    if (!target) {
      if (isForChaos) {
        target = this.room.players.minHpPlayers.top;
      } else {
        target = this.room.players.getPlayersExceptPlayer(player).minHpPlayers.top;
      }
    }

    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    const damage = concreteDamage ?? this.getDamage(4, isForChaos ? null : player, target);
    this.logger.debug(`Урон: ${damage}`);

    if (!damage) {
      return true;
    }

    if (canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: isForChaos ? undefined : player,
        cardAttack: this,
        title: isForChaos
          ? t('cryptoz.modals.title.willYouEvadeWithDamage', 'ru', {
              damage,
            })
          : t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
              nickname: player.nickname,
              damage,
            }),
      });
      this.logger.debug(`Попытка укрытия: ${isEvaded}`);

      if (isEvaded) {
        return true;
      }
    }

    let isKilled: boolean;

    if (isForChaos) {
      isKilled = target.takeDamage(damage, null, false);
    } else {
      isKilled = player.attack(target, damage, false);
    }

    if (isKilled) {
      const stoneShards = this.room.stoneShards.toShuffle().getStoneShardsFromBottom(2);

      if (!stoneShards.count) {
        return true;
      }

      const { stoneShards: selectedStoneShards } = await this.room.socketService.selectStoneShards({
        player,
        stoneShards: stoneShards,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.choose', 'ru') }],
        title: t('cryptoz.cards.soulPunisher.modals.title.chooseStoneShard', 'ru', {
          nickname: target.nickname,
        }),
      });

      if (!selectedStoneShards.top) {
        return false;
      }

      void target.takeStoneShard(selectedStoneShards.top, this.room.stoneShards, isForChaos ? null : player);
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
