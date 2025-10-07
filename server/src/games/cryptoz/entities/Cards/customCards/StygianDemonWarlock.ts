import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class StygianDemonWarlock extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.STYGIAN_DEMON_WARLOCK,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.stygianDemonWarlock.name', 'ru'),
      price: 9,
      baseEssence: 0,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.stygianDemonWarlock.description.general', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.stygianDemonWarlock.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;

    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    const topCard = this.room.deck.top;

    if (!topCard) {
      return Promise.resolve(true);
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      title: t('cryptoz.cards.stygianDemonWarlock.modals.title.showTopCard', 'ru'),
    });

    if (topCard.type === CryptozShared.ECardType.CHAOS) {
      player.addEssenceOnTurn(this.getEssence(3, player));
    }
    player.takeCardsToDeck(new CardGroup(ECardGroupType.ANY, [topCard]), this.room.deck);

    return Promise.resolve(true);
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
    const targets = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(targets.array.map(async targetPlayer => {
      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (isEvaded) {
        return;
      }

      const cardsToShow: CardGroup<ECardGroupType.ANY> = new CardGroup(ECardGroupType.ANY);
      const cardsToDiscard: CardGroup<ECardGroupType.ANY> = new CardGroup(ECardGroupType.ANY);

      if (targetPlayer.deck.count < 5) {
        targetPlayer.fillDeck();
      }

      const countCardsToCheck = _.min([5, targetPlayer.deck.count]) ?? 0;
      for (let i = 0; i < countCardsToCheck; i++) {
        const card = targetPlayer.deck.array[i];

        if (!card) {
          break;
        }
        cardsToShow.addCardToBottom(card);
        if (card.basePrice >= 1) {
          cardsToDiscard.addCardToBottom(card);
        }
      }

      if (cardsToDiscard.count) {
        targetPlayer.takeCardsToDiscard(cardsToDiscard, targetPlayer.deck);
      }

      if (!cardsToShow.count) {
        return;
      }

      this.room.socketService.showCards({
        players: this.room.playersAndViewers,
        cards: cardsToShow,
        title: t('cryptoz.modals.title.showCardsFromPlayerTopDeck', 'ru', {
          nickname: targetPlayer.nickname,
          count: cardsToShow.count,
        }),
      });
    }));

    return Promise.resolve(true);
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
