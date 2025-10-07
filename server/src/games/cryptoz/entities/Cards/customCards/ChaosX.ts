import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosX extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_X,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosX.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosX.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({
    tempPlayer,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.room.activePlayer;

    if (!player) {
      return Promise.resolve(false);
    }

    const playerCosts: Array<{ player: Player; totalCost: number }> = [];

    for (const currentPlayer of this.room.players.array) {
      let totalCost = 0;

      for (const card of currentPlayer.hand.array) {
        totalCost += card.getPrice(null);
      }

      playerCosts.push({ player: currentPlayer, totalCost });
    }

    const minCost = Math.min(...playerCosts.map(p => p.totalCost));

    const playersWithMinCost = playerCosts
      .filter(p => p.totalCost === minCost)
      .map(p => p.player);

    for (const targetPlayer of playersWithMinCost) {
      targetPlayer.takeCards(2);
    }

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
