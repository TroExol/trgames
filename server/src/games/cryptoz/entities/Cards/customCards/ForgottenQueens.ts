import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { TurnStartedTrigger } from '@/games/cryptoz/customTriggers/TurnStartedTrigger';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';

import type { TCardPlaySealHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ForgottenQueens extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.FORGOTTEN_QUEENS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.forgottenQueens.name', 'ru'),
      price: 3,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: true,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    seal: t('cryptoz.cards.forgottenQueens.description.seal', 'ru', {
      count: this.getHeal(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => true;

  private clearHandler = (player: Player | null) => {
    player?.triggersOnTurnStarted.removeTriggerById(this.readableId);
    player?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
    player?.triggersOnCardRemoved.removeTriggerById(this.readableId);
  };

  protected playSealHandler = (params: TCardPlaySealHandlerParams) => {
    const { isForChaos } = params;

    if (isForChaos || !this.owner) {
      return Promise.resolve(false);
    }

    this.logger.debug(`Разыгрывает ${this.ownerNickname}`);

    this.owner.triggersOnTurnStarted.addTrigger(new TurnStartedTrigger(this.readableId, () => {
      const sealCount = this.owner?.seals.count || 0;
      if (sealCount > 0) {
        const healAmount = this.getHeal(sealCount, this.owner);
        this.owner?.heal(healAmount);
        this.logger.debug(`Восстановлено ${healAmount} здоровья за ${sealCount} печатей`);
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
