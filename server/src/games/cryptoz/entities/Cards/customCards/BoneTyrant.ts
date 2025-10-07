import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class BoneTyrant extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.BONE_TYRANT,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.boneTyrant.name', 'ru'),
      price: 11,
      baseEssence: 0,
      gloryShards: 6,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.boneTyrant.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.boneTyrant.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    const rituals = player.discard.getCardsByType(CryptozShared.ECardType.RITUAL);

    if (rituals.count > 0) {
      player.takeCardsToHand(rituals, player.discard);
    } else {
      player.addEssenceOnTurn(this.getEssence(2, player));
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    const playersToAttack = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(playersToAttack.array.map(async (targetPlayer: Player) => {
      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (isEvaded) {
        return;
      }

      this.room.socketService.showCards({
        players: this.room.playersAndViewers,
        cards: targetPlayer.hand,
        title: t('cryptoz.modals.title.showPlayerHand', 'ru', {
          nickname: targetPlayer.nickname,
        }),
      });

      const gloryShardsInHand = targetPlayer.hand.array
        .reduce((sum, card) => sum + card.getGloryShards(targetPlayer), 0);
      const damage = this.getDamage(gloryShardsInHand * 3, null, targetPlayer);

      if (damage > 0) {
        targetPlayer.takeDamage(damage);
      }
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
