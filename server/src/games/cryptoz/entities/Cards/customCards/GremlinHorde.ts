import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class GremlinHorde extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.GREMLIN_HORDE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.gremlinHorde.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.gremlinHorde.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.gremlinHorde.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!isForChaos) {
      player?.addEssenceOnTurn(this.getEssence(2, player));
    }
    player?.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      player?.triggersOnTurnEnded.removeTriggerById(this.readableId);
      const removeCard = () => {
        for (const player of this.room.players.array) {
          for (const zone of Player.CARD_ZONES) {
            if (player[zone].removeCard(this)) {
              return true;
            }
          }
        }
        if (this.room.removed.cards.removeCard(this)) {
          return true;
        }
        return !!this.room.deck.removeCard(this);
      };
      if (!removeCard()) {
        this.logger.warn('Не удалось найти карту в конце хода');
        return;
      }
      this.owner?.deck.addCardToBottom(this);
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
