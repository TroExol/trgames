import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class FruitPredator extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.FRUIT_PREDATOR,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.fruitPredator.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.fruitPredator.description.strike', 'ru', {
      count: this.getHeal(4, isSimple ? null : this.owner),
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

  public canPlayStrikeHandler = () => !!this.room.cursedSeals.count;

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

    let targets = concreteTarget && new PlayerGroup([concreteTarget]);

    if (!targets) {
      if (isForChaos) {
        targets = this.room.players;
      } else {
        targets = this.room.players.getPlayersExceptPlayer(player);
      }
    }

    await Promise.allSettled(targets.array.map(async target => {
      if (!this.room.cursedSeals.count) {
        return;
      }

      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: player,
          cardAttack: this,
          title: isForChaos
            ? t('cryptoz.modals.title.willYouEvade', 'ru')
            : t('cryptoz.modals.title.willYouEvadeFromPlayer', 'ru', {
                nickname: player.nickname,
              }),
        });
        this.logger.debug(`Попытка укрытия: ${isEvaded}`);

        if (isEvaded) {
          if (!isForChaos) {
            player.heal(this.getHeal(4, player));
          }
          return;
        }
      }

      target.takeCardsToDiscard(1, this.room.cursedSeals);
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
