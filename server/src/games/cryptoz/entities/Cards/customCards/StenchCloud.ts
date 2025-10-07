import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';

import type {
  TCardEvadeHandlerParams,
  TCardPlayGeneralHandlerParams,
  TCardPlayStrikeHandlerParams,
} from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class StenchCloud extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.STENCH_CLOUD,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.stenchCloud.name', 'ru'),
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
    strike: t('cryptoz.cards.stenchCloud.description.strike', 'ru'),
    evade: t('cryptoz.cards.stenchCloud.description.evade', 'ru'),
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
    tempPlayer,
    isForChaos,
    canEvade,
    concreteTarget,
  }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;

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
      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: isForChaos ? undefined : player,
          cardAttack: this,
          title: isForChaos
            ? t('cryptoz.modals.title.willYouEvade', 'ru')
            : t('cryptoz.modals.title.willYouEvadeFromPlayer', 'ru', {
                nickname: player.nickname,
              }),
        });
        this.logger.debug(`Попытка укрытия: ${isEvaded}`);

        if (isEvaded) {
          return;
        }
      }
      target.takeCardsToDiscard(1, this.room.cursedSeals);
    }));
    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = ({ attacker }: TCardEvadeHandlerParams) => {
    if (!this.owner) {
      return Promise.resolve(false);
    }
    this.owner.takeCards(1);
    if (!attacker) {
      return Promise.resolve(false);
    }
    attacker.takeCardsToDiscard(1, this.room.cursedSeals);
    return Promise.resolve(true);
  };
}
