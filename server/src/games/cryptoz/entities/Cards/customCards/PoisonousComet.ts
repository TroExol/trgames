import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardTookTrigger } from '@/games/cryptoz/customTriggers/CardTookTrigger';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class PoisonousComet extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.POISONOUS_COMET,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.poisonousComet.name', 'ru'),
      price: 5,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.poisonousComet.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = (params: TCardPlayGeneralHandlerParams) => {
    const { tempPlayer, isForChaos } = params;

    if (isForChaos) {
      return Promise.resolve(false);
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return Promise.resolve(false);
    }

    player.takeCards(1);

    player.triggersOnCardBought.addTrigger(new CardBoughtTrigger(this.readableId, (card, price) => {
      void this.playStrike({
        tempPlayer: player,
        concreteDamage: price,
        force: true,
      });
    }));
    player.triggersOnCardTook.addTrigger(new CardTookTrigger(this.readableId, (t, card, f, prevOwnerNickname) => {
      if (prevOwnerNickname === player?.nickname) {
        return;
      }
      void this.playStrike({
        tempPlayer: player,
        concreteDamage: card.basePrice,
        force: true,
      });
    }));

    player.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      player?.triggersOnTurnEnded.removeTriggerById(this.readableId);
      player?.triggersOnCardBought.removeTriggerById(this.readableId);
      player?.triggersOnCardTook.removeTriggerById(this.readableId);
    }));

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = async ({
    isForChaos,
    tempPlayer,
    concreteTarget,
    concreteDamage,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    if (isForChaos || !tempPlayer) {
      return false;
    }
    if (!concreteDamage) {
      return true;
    }

    const target = concreteTarget ?? await this.room.socketService.selectTarget({
      player: tempPlayer,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(tempPlayer),
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target) {
      return false;
    }

    this.logger.debug(`Урон: ${concreteDamage}`);

    if (canEvade) {
      const isEvaded = await target.tryEvade({
        attacker: tempPlayer,
        cardAttack: this,
        damage: concreteDamage,
        title: t('cryptoz.modals.title.willYouEvadeWithDamageFromPlayer', 'ru', {
          nickname: tempPlayer.nickname,
          count: concreteDamage,
        }),
      });
      this.logger.debug(`Попытка укрытия: ${isEvaded}`);

      if (isEvaded) {
        return true;
      }
    }

    tempPlayer.attack(target, concreteDamage);
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
