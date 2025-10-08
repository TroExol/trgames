import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard/types';

export class SmolderingEnd extends AbstractCard {
  constructor(room?: Room) {
    super({
      room,
      id: CryptozShared.ECardId.SMOLDERING_END,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.smolderingEnd.name', 'ru'),
      price: 9,
      baseEssence: 0,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.smolderingEnd.description.general', 'ru'),
    totalStrike: t('cryptoz.cards.smolderingEnd.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.takeCards(3);
    player.takeDamage(3);

    this.logger.info(`${player.nickname} взял 3 карты и получил 3 урона`);
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    if (target) {
      return Promise.resolve(false);
    }

    this.logger.info('Начинается тотальный мракобой');

    const allPlayers = this.room.players.array;

    if (allPlayers.length <= 1) {
      this.logger.info('Недостаточно участников для тотального мракобоя');
      return true;
    }

    const unprotectedPlayers: PlayerGroup = new PlayerGroup();

    await Promise.allSettled(allPlayers.map(async player => {
      const isEvaded = await player.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });
      if (!isEvaded) {
        unprotectedPlayers.addPlayerToTop(player);
      }
    }));

    if (unprotectedPlayers.count <= 1) {
      this.logger.info('Слишком мало незащищенных участников, тотальный мракобой не выполняется');
      return true;
    }

    await Promise.allSettled(unprotectedPlayers.array.map(async targetPlayer => {
      const leftPlayer = unprotectedPlayers.getLeftPlayer(targetPlayer);

      if (!leftPlayer) {
        this.logger.debug(`У участника ${targetPlayer.nickname} нет левого участника`);
        return;
      }

      if (targetPlayer.hand.count === 0) {
        this.logger.debug(`У участника ${targetPlayer.nickname} нет карт в руке`);
        return;
      }

      const { cards, variant } = await this.room.socketService.selectCards({
        player: targetPlayer,
        cards: targetPlayer.hand,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.give', 'ru') }],
        title: t('cryptoz.cards.smolderingEnd.modals.title.giveCardsFromHand', 'ru', {
          count: 1,
          nickname: leftPlayer.nickname,
        }),
      });

      const selectedCard = cards.top;
      const card = selectedCard || targetPlayer.hand.randomCard;

      if (variant !== 1 || !card) {
        return;
      }

      if (!selectedCard) {
        this.room.socketService.showEntities({
          players: this.room.playersAndViewers,
          cards: new CardGroup(ECardGroupType.ANY, [card]),
          title: t('cryptoz.modals.title.randomTransferredCardBetweenPlayers', 'ru', {
            fromNickname: targetPlayer.nickname,
            toNickname: leftPlayer.nickname,
          }),
        });
      }

      const cardPrice = card.getPrice(null);
      const damage = this.getDamage(cardPrice * 2, null, leftPlayer);

      leftPlayer.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [card]), targetPlayer.hand);
      leftPlayer.takeDamage(damage);
    }));

    return true;
  };

  protected onChangeOwner = () => {};

  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
}
