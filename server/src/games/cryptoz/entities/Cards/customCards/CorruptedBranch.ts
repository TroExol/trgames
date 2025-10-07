import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { toPlayerVariant } from '@/games/cryptoz/helpers/utils';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class CorruptedBranch extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CORRUPTED_BRANCH,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.corruptedBranch.name', 'ru'),
      price: 4,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.takeCardsFromHand', 'ru', {
      count: 1,
    }),
    strike: t('cryptoz.cards.corruptedBranch.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.takeCards(1);
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = ({ tempPlayer }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if ([
      ...(player?.hand.array ?? []),
      ...(player?.discard.array ?? []),
    ].some(card => card.getPrice(player) === 0)) {
      return true;
    }
    return false;
  };

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player || isForChaos) {
      return false;
    }

    const handCards = player.hand.array.filter(card => card.getPrice(player) === 0);
    const discardCards = player.discard.array.filter(card => card.getPrice(player) === 0);

    const { cards, variant: target } = await this.room.socketService.selectCards<string>({
      player,
      cards: new CardGroup(ECardGroupType.ANY, [
        ...handCards,
        ...discardCards,
      ]),
      cardsSubtitle: Object.fromEntries([
        ...handCards.map(card => [card.readableId, t('cryptoz.cards.places.hand', 'ru')] as const),
        ...discardCards.map(card => [card.readableId, t('cryptoz.cards.places.discard', 'ru')] as const),
      ]),
      variants: concreteTarget
        ? [toPlayerVariant(concreteTarget)]
        : this.room.players.getPlayersExceptPlayer(player).array.map(toPlayerVariant),
      title: t('cryptoz.cards.corruptedBranch.modals.title.chooseCardToGive', 'ru'),
    });
    this.logger.debug(`Цель ${target}`);

    const selectedCard = cards.top;

    if (!target || !selectedCard) {
      return false;
    }

    const enemy = this.room.players.getPlayerByNickname(target);

    if (!enemy) {
      return false;
    }

    if (canEvade) {
      const isEvaded = await enemy.tryEvade({
        attacker: player,
        cardAttack: this,
        cardsToShow: cards,
        title: t('cryptoz.cards.corruptedBranch.modals.title.willYouEvade', 'ru', {
          nickname: player.nickname,
        }),
      });

      if (isEvaded) {
        return true;
      }
    }

    const isFromHand = !!player.hand.getCard(selectedCard);
    const isFromDiscard = !!player.discard.getCard(selectedCard);

    if (isFromDiscard) {
      enemy.takeCardsToHand(new CardGroup(ECardGroupType.ANY, [selectedCard]), player.discard);
    } else if (isFromHand) {
      enemy.takeCardsToHand(new CardGroup(ECardGroupType.ANY, [selectedCard]), player.hand);
    }

    this.logger.debug(`Карта ${selectedCard.name} передана участнику ${enemy.nickname}`);
    return true;
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
