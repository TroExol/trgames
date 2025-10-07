import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class WizardsChildren extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.WIZARDS_CHILDREN,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.wizardsChildren.name', 'ru'),
      price: 6,
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
    strike: t('cryptoz.cards.wizardsChildren.description.strike', 'ru', {
      count: this.getDamage(2, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({
    tempPlayer,
    isForChaos,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(this.getEssence(3, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteDamage,
    concreteTarget,
    tempPlayer,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (!player) {
      return Promise.resolve(false);
    }

    // Если указана конкретная цель, атакуем только её, иначе всех врагов
    let targets: typeof this.room.players.array;
    if (concreteTarget) {
      targets = [concreteTarget];
    } else if (isForChaos) {
      targets = this.room.players.array;
    } else {
      targets = this.room.players.getPlayersExceptPlayer(player).array;
    }

    await Promise.allSettled(targets.map(async target => {
      const evadeCardsInDiscard = target.discard.array.filter(card => card.hasEvade);
      const totalDamage = concreteDamage ?? this.getDamage(evadeCardsInDiscard.length * 2, player, target);
      if (totalDamage <= 0) {
        return;
      }
      if (canEvade) {
        const isEvaded = await target.tryEvade({
          attacker: isForChaos ? undefined : player,
          cardAttack: this,
          damage: totalDamage,
          title: isForChaos
            ? t('cryptoz.modals.title.willYouEvadeWithDamage', 'ru', {
                count: totalDamage,
              })
            : t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
                count: totalDamage,
                player: player.nickname,
              }),
        });
        if (isEvaded) {
          return;
        }
      }
      if (isForChaos) {
        target.takeDamage(totalDamage);
      } else {
        player.attack(target, totalDamage);
      }
    }));
    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
