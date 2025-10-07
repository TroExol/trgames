import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class BottomlessVoid extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.BOTTOMLESS_VOID,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.bottomlessVoid.name', 'ru'),
      price: 3,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.bottomlessVoid.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({
    tempPlayer,
    isForChaos,
    concreteTarget,
    canEvade,
  }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player || isForChaos) {
      return false;
    }

    // Получаем всех противников
    const enemies = concreteTarget
      ? new PlayerGroup([concreteTarget])
      : this.room.players.getPlayersExceptPlayer(player);

    if (enemies.count === 0) {
      this.logger.debug('Нет противников для атаки');
      return true;
    }

    // Показываем верхние карты стопок всех противников
    const availableTargets: Array<{ enemy: Player; card: AbstractCard }> = [];

    await Promise.allSettled(enemies.array.map(async enemy => {
      if (canEvade) {
        const isEvaded = await enemy.tryEvade({
          attacker: player,
          cardAttack: this,
          title: t('cryptoz.cards.bottomlessVoid.modals.title.willYouEvade', 'ru', {
            nickname: player.nickname,
          }),
        });
        this.logger.debug(`Попытка укрытия ${enemy.nickname}: ${isEvaded}`);

        if (isEvaded) {
          return;
        }
      }

      let topCard = enemy.deck.top;
      if (!topCard) {
        enemy.fillDeck();
        topCard = enemy.deck.top;
      }
      if (topCard) {
        this.logger.debug(`Противник ${enemy.nickname} показывает верхнюю карту: ${topCard.name}`);
        availableTargets.push({ enemy, card: topCard });
      }
    }));

    if (availableTargets.length === 0) {
      this.logger.debug('Некого атаковать');
      return true;
    }

    const cardGroup = new CardGroup(ECardGroupType.ANY);
    for (const { card } of availableTargets) {
      cardGroup.addCardToTop(card);
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers.getPlayersExceptPlayer(player),
      cards: cardGroup,
      cardsSubtitle: Object.fromEntries(
        availableTargets.map(({ card, enemy }) => [card.readableId, enemy.nickname] as const),
      ),
      title: t('cryptoz.modals.title.showCardsFromTopDeckPlayers', 'ru', {
        count: 1,
      }),
    });

    const result = await this.room.socketService.selectCards({
      player,
      cards: cardGroup,
      cardsSubtitle: Object.fromEntries(
        availableTargets.map(({ card, enemy }) => [card.readableId, enemy.nickname] as const),
      ),
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.discard', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.cards.bottomlessVoid.modals.title.chooseCardsToDiscard', 'ru'),
      count: null,
    });

    if (!result.cards.count || result.variant === 2) {
      return true;
    }

    for (const cardToDiscard of result.cards.array) {
      const topCardInfo = availableTargets.find(({ card }) => card.theSameUuid(cardToDiscard.uuid));
      if (topCardInfo) {
        const { enemy, card } = topCardInfo;
        enemy.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [card]), enemy.deck);
      }
    }

    return true;
  };

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  protected playEvadeHandler = () => Promise.resolve(false);
}
