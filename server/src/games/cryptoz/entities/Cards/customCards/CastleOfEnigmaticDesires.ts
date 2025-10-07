import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';
import { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';

import type { TCardPlaySealHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class CastleOfEnigmaticDesires extends AbstractCard {
  private isPlayedOnTurn = false;

  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CASTLE_OF_ENIGMATIC_DESIRES,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CRYPT,
      name: t('cryptoz.cards.castleOfEnigmaticDesires.name', 'ru'),
      price: 5,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: true,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    seal: t('cryptoz.cards.castleOfEnigmaticDesires.description.seal', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => true;

  private clearHandler = (player: Player | null) => {
    player?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    player?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
    player?.triggersOnCardRemoved.removeTriggerById(this.readableId);
  };

  protected playSealHandler = (params: TCardPlaySealHandlerParams) => {
    const { isForChaos } = params;

    if (isForChaos || !this.owner) {
      return Promise.resolve(false);
    }

    this.logger.debug(`Разыгрывает ${this.ownerNickname}`);

    this.owner.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, card => {
      if (card.type === CryptozShared.ECardType.RITUAL && !this.isPlayedOnTurn) {
        this.isPlayedOnTurn = true;
        this.owner?.takeCards(1);
      }
    }));

    this.owner.triggersOnCardDiscarded.addTrigger(new CardDiscardedTrigger(this.readableId, card => {
      if (card === this) {
        this.clearHandler(this.owner);
      }
    }));
    this.owner.triggersOnCardRemoved.addTrigger(new CardRemovedTrigger(this.readableId, card => {
      if (card === this) {
        this.clearHandler(this.owner);
      }
    }));
    this.owner.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.isPlayedOnTurn = false;
    }));

    return Promise.resolve(true);
  };

  protected onChangeOwner = (prevOwner: Player | null) => {
    this.clearHandler(prevOwner);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
