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

export class DungeonOfWailingShadows extends AbstractCard {
  private isPlayedOnTurn = false;

  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DUNGEON_OF_WAILING_SHADOWS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CRYPT,
      name: t('cryptoz.cards.dungeonOfWailingShadows.name', 'ru'),
      price: 5,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: true,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    seal: t('cryptoz.cards.dungeonOfWailingShadows.description.seal', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => true;

  protected playSealHandler = (params: TCardPlaySealHandlerParams) => {
    const { isForChaos } = params;

    if (isForChaos || !this.owner) {
      return Promise.resolve(false);
    }

    this.logger.debug(`Разыгрывает ${this.ownerNickname}`);

    this.owner.triggersOnCardPlayed.addTrigger(new CardPlayedTrigger(this.readableId, card => {
      if (card.type === CryptozShared.ECardType.CREATURE && !this.isPlayedOnTurn) {
        this.isPlayedOnTurn = true;
        this.owner?.takeCards(1);
      }
    }));

    const clearHandler = () => {
      this.owner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
      this.owner?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
      this.owner?.triggersOnCardRemoved.removeTriggerById(this.readableId);
      this.owner?.triggersOnTurnEnded.removeTriggerById(this.readableId);
    };
    this.owner.triggersOnCardDiscarded.addTrigger(new CardDiscardedTrigger(this.readableId, card => {
      if (card === this) {
        clearHandler();
      }
    }));
    this.owner.triggersOnCardRemoved.addTrigger(new CardRemovedTrigger(this.readableId, card => {
      if (card === this) {
        clearHandler();
      }
    }));
    this.owner.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.isPlayedOnTurn = false;
    }));

    return Promise.resolve(true);
  };

  protected onChangeOwner = (prevOwner: Player | null) => {
    prevOwner?.triggersOnCardPlayed.removeTriggerById(this.readableId);
    prevOwner?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
    prevOwner?.triggersOnCardRemoved.removeTriggerById(this.readableId);
    prevOwner?.triggersOnTurnEnded.removeTriggerById(this.readableId);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
