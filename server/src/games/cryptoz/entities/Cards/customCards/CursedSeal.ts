import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractCard } from '../AbstractCard';

export class CursedSeal extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CURSED_SEAL,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CURSED_SEAL,
      name: t('cryptoz.cards.cursedSeal.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: -1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.cursedSeal.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => false;

  protected playGeneralHandler = () => Promise.resolve(false);

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
