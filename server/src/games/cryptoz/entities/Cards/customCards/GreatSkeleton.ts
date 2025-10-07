import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';
import { CountStoneShardsModifier } from '@/games/cryptoz/customModifiers/CountStoneShardsModifier';

import type { TCardPlaySealHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class GreatSkeleton extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.GREAT_SKELETON,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.greatSkeleton.name', 'ru'),
      price: 3,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: true,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    seal: t('cryptoz.cards.greatSkeleton.description.seal', 'ru'),
    other: t('cryptoz.cards.greatSkeleton.description.other', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => true;

  protected playSealHandler = (params: TCardPlaySealHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    if (isForChaos) {
      return Promise.resolve(false);
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает печать ${player?.nickname}`);

    if (!player) {
      return Promise.resolve(false);
    }

    // Добавляем модификатор для увеличения количества осколков философского камня
    player.modifiersCountStoneShards.addModifier(
      new CountStoneShardsModifier(this.readableId, currentValue => currentValue + 1, { order: 9999 }),
    );

    const clearHandler = () => {
      player?.modifiersCountStoneShards.removeModifierById(this.readableId);
      player?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
      player?.triggersOnCardRemoved.removeTriggerById(this.readableId);
    };

    player.triggersOnCardDiscarded.addTrigger(new CardDiscardedTrigger(this.readableId, card => {
      if (card === this) {
        clearHandler();
      }
    }));
    player.triggersOnCardRemoved.addTrigger(new CardRemovedTrigger(this.readableId, card => {
      if (card === this) {
        clearHandler();
      }
    }));

    this.logger.info(`Печать активирована: +1 к количеству осколков Философского камня`);

    return Promise.resolve(true);
  };

  protected onChangeOwner = (prevOwner: Player | null) => {
    prevOwner?.modifiersCountStoneShards.removeModifierById(this.readableId);
    prevOwner?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
    prevOwner?.triggersOnCardRemoved.removeTriggerById(this.readableId);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  protected playEvadeHandler = () => Promise.resolve(false);

  public getGloryShards = (): typeof this.baseGloryShards => {
    if (!this.owner) {
      return this.baseGloryShards;
    }

    return this.owner.stoneShards.count;
  };
}
