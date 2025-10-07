import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class DarknessMadness extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.DARKNESS_MADNESS,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.DARKNESS_MADNESS,
      name: t('cryptoz.cards.darknessMadness.name', 'ru'),
      price: 3,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.darknessMadness.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    if (isForChaos) {
      return false;
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    const selectedVariant = await this.room.socketService.selectVariant<number>({
      player,
      variants: [
        {
          id: 1,
          value: t('cryptoz.cards.darknessMadness.modals.variants.takeEssence', 'ru', {
            count: this.getEssence(2, player),
          }),
        },
        { id: 2, value: t('cryptoz.cards.darknessMadness.modals.variants.takeCard', 'ru') },
      ],
      title: t('cryptoz.modals.title.chooseAction', 'ru'),
    });

    if (!selectedVariant) {
      return false;
    }

    if (selectedVariant === 1) {
      player.addEssenceOnTurn(this.getEssence(2, player));
      return true;
    }

    const target = await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
      title: t('cryptoz.cards.darknessMadness.modals.title.choosePlayer', 'ru'),
    });
    this.logger.debug(`Цель ${target?.nickname}`);

    if (!target || target === player) {
      return false;
    }

    if (!target.deck.count) {
      target.fillDeck();
    }

    const topCard = target.deck.top;

    if (!topCard) {
      return true;
    }

    target.deck.removeCard(topCard);

    this.room.socketService.showCards({
      players: this.room.playersAndViewers,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      title: t('cryptoz.cards.darknessMadness.modals.title.playerTookCard', 'ru', {
        player: player.nickname,
        target: target.nickname,
      }),
    });
    player.logger.debug(`Вытащил карту: ${topCard.id}`);

    if (topCard.isSeal) {
      topCard.changeOwner(player.nickname);
      player.hand.addCardToTop(topCard);
      await topCard.play();
      this.room.addLog(t('cryptoz.cards.darknessMadness.log.playerTookSeal', 'ru', {
        player: player.nickname,
        card: topCard.name,
        target: target.nickname,
      }));
      return true;
    }

    await topCard.play({ tempPlayer: player });
    target.discard.addCardToTop(topCard);

    return true;
  };

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
