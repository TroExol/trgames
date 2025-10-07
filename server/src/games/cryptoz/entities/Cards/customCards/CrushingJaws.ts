import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import {
  AbstractCard,
  type TCardPlayGeneralHandlerParams,
  type TCardPlayStrikeHandlerParams,
} from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class CrushingJaws extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CRUSHING_JAWS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.crushingJaws.name', 'ru'),
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
    strike: t('cryptoz.cards.crushingJaws.description.strike', 'ru', {
      count: this.getDamage(4, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = (params: TCardPlayGeneralHandlerParams) => {
    const { tempPlayer, isForChaos } = params;

    if (isForChaos) {
      return Promise.resolve(false);
    }

    const player = tempPlayer ?? this.owner;
    if (!player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

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

    let targets = concreteTarget ? new PlayerGroup([concreteTarget]) : null;
    if (!targets) {
      targets = isForChaos ? this.room.players : this.room.players.getPlayersExceptPlayer(player);
    }
    let totalDamageDealt = 0;

    await Promise.allSettled(targets.array.map(async target => {
      const countHarbingersInDiscard = target.discard.getCountCardsByType(CryptozShared.ECardType.HARBINGER);
      const damage = this.getDamage(4 * countHarbingersInDiscard, isForChaos ? null : player, target);

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

      totalDamageDealt += damage;
      player.attack(target, damage);
    }));

    if (totalDamageDealt || !player.hand.count || isForChaos) {
      return true;
    }

    const { cards, variant } = await this.room.socketService.selectCards({
      player,
      cards: player.hand,
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.modals.title.mayRemoveCardsFromHand', 'ru', {
        count: 1,
      }),
    });

    if (!cards.count || variant === 2) {
      return true;
    }

    player.removeCards(cards, 'hand');

    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
