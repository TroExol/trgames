import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class TaintedWarrior extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.TAINTED_WARRIOR,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.taintedWarrior.name', 'ru'),
      price: 10,
      baseEssence: 2,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.taintedWarrior.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.taintedWarrior.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return false;
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
    player.takeCards(1);

    const handCursedSeals = player.hand.getCardsByType(CryptozShared.ECardType.CURSED_SEAL);
    const discardCursedSeals = player.discard.getCardsByType(CryptozShared.ECardType.CURSED_SEAL);

    if (handCursedSeals.count > 0) {
      const { cards: handCards, variant } = await this.room.socketService.selectCards({
        player,
        cards: handCursedSeals,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
        ],
        title: t('cryptoz.cards.taintedWarrior.modals.title.chooseCardToDestroyFromHand', 'ru'),
      });

      if (variant === 1 && !!handCards.count) {
        player.removeCards(handCards, 'hand');
      }
    }

    if (discardCursedSeals.count > 0) {
      const { cards: discardCards, variant } = await this.room.socketService.selectCards({
        player,
        cards: discardCursedSeals,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
        ],
        title: t('cryptoz.cards.taintedWarrior.modals.title.chooseCardToDestroyFromDiscard', 'ru'),
      });

      if (variant === 1 && !!discardCards.count) {
        player.removeCards(discardCards, 'discard');
      }
    }

    return true;
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams): Promise<boolean> => {
    const creatureCount = this.room.market.getCountCardsByType(CryptozShared.ECardType.CREATURE);

    if (creatureCount === 0) {
      this.logger.debug('На рынке нет существ');
      return true;
    }

    this.logger.debug(`Количество существ на рынке: ${creatureCount}`);

    const targets = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(targets.array.map(async targetPlayer => {
      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        title: `Тотальный мракобой. Будешь укрываться?`,
      });

      if (isEvaded) {
        return;
      }

      targetPlayer.takeCardsToDiscard(creatureCount, this.room.cursedSeals);
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
