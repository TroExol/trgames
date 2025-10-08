import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { toPlayerVariant } from '@/games/cryptoz/helpers/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class Noctullos extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.NOCTULLOS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.noctullos.name', 'ru'),
      price: 7,
      baseEssence: 0,
      gloryShards: 3,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.noctullos.description.general', 'ru'),
    other: t('cryptoz.cards.noctullos.description.other', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    const targets = player && !isForChaos
      ? this.room.players.getPlayersExceptPlayer(player)
      : this.room.players;

    const randomCards = new CardGroup(ECardGroupType.ANY);
    const cardsSubtitle: Record<string, string> = {};

    targets.array.forEach(target => {
      const randomCard = target.hand.randomCard;
      if (!randomCard) {
        return;
      }
      randomCards.addCardToBottom(randomCard);
      cardsSubtitle[randomCard.readableId] = t('cryptoz.modals.subtitle.cardOwner', 'ru', {
        nickname: target.nickname,
      });
      target.discardHand(new CardGroup(ECardGroupType.ANY, [randomCard]));
      let damage = target.modifiersDamageToSelf.apply(randomCard.basePrice, randomCard);
      if (player && !isForChaos) {
        damage = player.modifiersDamageToOther.apply(damage, randomCard);
      }
      if (isForChaos) {
        target.takeDamage(damage);
      } else {
        player?.attack(target, damage);
      }
    });

    if (randomCards.count) {
      this.room.socketService.showEntities({
        players: this.room.playersAndViewers,
        cards: randomCards,
        cardsSubtitle,
        title: t('cryptoz.modals.title.randomCardsEffect', 'ru', { cardName: this.name }),
      });
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = (prevOwner: Player | null, newOwner: Player | null) => {
    prevOwner?.triggersOnCardRemoved.removeTriggerById(this.readableId);

    if (!newOwner) {
      this.logger.debug('Карта передана не участнику');
      return;
    }

    newOwner.triggersOnCardRemoved.removeTriggerById(this.id);
    newOwner.triggersOnCardRemoved.addTrigger(new CardRemovedTrigger(this.id, (card, from, removedTo) => {
      if (card === this) {
        return;
      }

      const otherPlayers = this.room.players.getPlayersExceptPlayer(newOwner);
      if (otherPlayers.count === 0) {
        return;
      }

      void this.room.socketService.selectCards<string>({
        player: newOwner,
        cards: new CardGroup(ECardGroupType.ANY, [card]),
        variants: otherPlayers.array.map(toPlayerVariant),
        title: t('cryptoz.cards.noctullos.modals.title.giveCardToAnotherPlayer', 'ru'),
      }).then(res => {
        if (!res.variant) {
          return;
        }

        const target = this.room.players.getPlayerByNickname(res.variant);
        if (!target) {
          return;
        }

        target.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [card]), removedTo);

        const message = t('cryptoz.cards.noctullos.logs.giveCardToAnotherPlayer', 'ru', {
          nickname: newOwner.nickname,
          cardName: card.name,
          targetNickname: target.nickname,
        });
        this.room.addLog(message);
        newOwner.logger.info(message);
      });
    }));
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
}
