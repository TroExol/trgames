import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class PrisonerOfDarkness extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.PRISONER_OF_DARKNESS,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.prisonerOfDarkness.name', 'ru'),
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
    strike: t('cryptoz.cards.prisonerOfDarkness.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({
    tempPlayer,
    isForChaos,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) return false;
    player.addEssenceOnTurn(this.getEssence(2, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const target = concreteTarget ?? await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
    });

    if (!target) {
      return false;
    }

    if (!target.deck.count) {
      target.fillDeck();
    }

    const topCard = target.deck.top;

    if (!topCard) {
      return false;
    }

    const damage = this.getDamage(topCard.basePrice, player, target);
    if (damage <= 0) {
      return true;
    }

    if (canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: isForChaos ? undefined : player,
        cardAttack: this,
        damage,
        title: isForChaos
          ? t('cryptoz.modals.title.willYouEvadeWithDamage', 'ru', {
              damage,
            })
          : t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
              nickname: player.nickname,
              damage,
            }),
      });
      if (isEvaded) {
        return true;
      }
    }

    player.attack(target, damage);

    return true;
  };

  public canPlaySealHandler = () => false;
  protected playSealHandler = async () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = async () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = async () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
