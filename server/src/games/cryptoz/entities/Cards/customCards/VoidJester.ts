import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { EssenceModifier } from '@/games/cryptoz/customModifiers/EssenceModifier';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class VoidJester extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.VOID_JESTER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.voidJester.name', 'ru'),
      price: 6,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }) + '. ' + t('cryptoz.cards.voidJester.description.general', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.voidJester.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(3, player));

    player.modifiersEssence.addModifier(new EssenceModifier(this.readableId, currentValue => {
      return currentValue + (player?.discard.getCountCardsByType(CryptozShared.ECardType.RITUAL) >= 3 ? 3 : 0);
    }));
    player.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      player?.modifiersEssence.removeModifierById(this.readableId);
      player?.triggersOnTurnEnded.removeTriggerById(this.readableId);
    }));
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

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
