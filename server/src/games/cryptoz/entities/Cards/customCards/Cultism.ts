import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class Cultism extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CULTISM,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.cultism.name', 'ru'),
      price: 7,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.descriptions.dealDamageToEachEnemy', 'ru', {
      count: this.getDamage(7, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(this.getEssence(3, player));
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
    if (!player) {
      return false;
    }

    // Если указана конкретная цель, атакуем только её, иначе всех врагов
    let targets: PlayerGroup;
    if (concreteTarget) {
      targets = new PlayerGroup([concreteTarget]);
    } else if (isForChaos) {
      targets = this.room.players;
    } else {
      targets = this.room.players.getPlayersExceptPlayer(player);
    }

    await Promise.allSettled(targets.array.map(async target => {
      const damage = concreteDamage ?? this.getDamage(7, player, target);
      if (!damage) {
        return;
      }
      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: isForChaos ? undefined : player,
          cardAttack: this,
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
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
}
