import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class MrShadowcat extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.MR_SHADOWCAT,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.mrShadowcat.name', 'ru'),
      price: 6,
      baseEssence: 0,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.mrShadowcat.description.general', 'ru'),
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

    player.takeCards(2);

    const { cards } = await this.room.socketService.selectCards({
      player,
      cards: player.hand,
      variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
      title: t('cryptoz.modals.title.discardCardsFromHand', 'ru', {
        count: 1,
      }),
    });

    const card = cards.bottom;

    this.logger.debug(`Выбрана карта ${card?.name}`);
    if (card) {
      player.discardHand(cards);
      player.heal(this.getHeal(card.basePrice, player));
    }

    if (player.health < 25) {
      return true;
    }

    const { stoneShards } = await this.room.socketService.selectStoneShards({
      player,
      stoneShards: player.stoneShards,
      variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
      title: t('cryptoz.modals.title.discardStoneShardsFromHand', 'ru', {
        count: 1,
      }),
    });
    player.discardStoneShard(stoneShards);

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
