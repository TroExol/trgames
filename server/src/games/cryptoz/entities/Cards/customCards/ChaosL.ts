import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosL extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_L,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosL.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosL.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => !!this.room.removed.chaos.count;

  protected playGeneralHandler = async ({
    tempPlayer,
    concreteTargets,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    if (!tempPlayer) {
      return false;
    }

    const selectedChaos: AbstractCard[] = [];
    const chaosToSelect = this.room.removed.chaos.clone();

    for (let i = 0; i < 2; i++) {
      const randomChaos = chaosToSelect.randomCard;
      if (randomChaos) {
        selectedChaos.push(randomChaos);
        chaosToSelect.removeCard(randomChaos);
      }
    }

    for (const chaos of selectedChaos) {
      await this.room.playChaos(chaos, {
        tempPlayer,
        concreteTargets,
      });
    }

    return true;
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
