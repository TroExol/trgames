import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { KillingTrigger } from '@/games/cryptoz/customTriggers/KillingTrigger';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';
import { DamageModifier } from '@/games/cryptoz/customModifiers/DamageModifier';

import type { TCardPlaySealHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class CatacombsOfDarkness extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CATACOMBS_OF_DARKNESS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CRYPT,
      name: t('cryptoz.cards.catacombsOfDarkness.name', 'ru'),
      price: 7,
      baseEssence: 0,
      gloryShards: 2,
      isSeal: true,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    seal: t('cryptoz.cards.catacombsOfDarkness.description.seal', 'ru'),
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

    this.owner.modifiersDamageToOther.addModifier(
      new DamageModifier(this.readableId, currentValue => currentValue * 2, { order: 9999 }),
    );

    const clearHandler = () => {
      this.owner?.modifiersDamageToOther.removeModifierById(this.readableId);
      this.owner?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
      this.owner?.triggersOnCardRemoved.removeTriggerById(this.readableId);
      this.owner?.triggersOnKilling.removeTriggerById(this.readableId);
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
    this.owner.triggersOnKilling.addTrigger(new KillingTrigger(this.readableId, () => {
      this.owner?.discardSeal(new CardGroup(ECardGroupType.ANY, [this]));
    }));

    return Promise.resolve(true);
  };

  protected onChangeOwner = (prevOwner: Player | null) => {
    prevOwner?.modifiersDamageToOther.removeModifierById(this.readableId);
    prevOwner?.triggersOnCardDiscarded.removeTriggerById(this.readableId);
    prevOwner?.triggersOnCardRemoved.removeTriggerById(this.readableId);
    prevOwner?.triggersOnKilling.removeTriggerById(this.readableId);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
