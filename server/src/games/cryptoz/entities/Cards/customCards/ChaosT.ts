import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosT extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_T,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosT.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    strike: t('cryptoz.cards.chaosT.description.strike', 'ru'),
  });

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    tempPlayer,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.room.activePlayer;

    if (!player) {
      return Promise.resolve(false);
    }

    const leftPlayer = this.room.players.getLeftPlayer(player);
    if (!leftPlayer) {
      return Promise.resolve(false);
    }

    if (canEvade) {
      const isEvaded = await player.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvade', 'ru'),
      });

      if (isEvaded) {
        return Promise.resolve(true);
      }
    }

    leftPlayer.takeCards(2);

    return Promise.resolve(true);
  };

  public canPlayGeneralHandler = () => false;
  protected playGeneralHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
