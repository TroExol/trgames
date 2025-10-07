import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class WhisperingEdge extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.WHISPERING_EDGE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.whisperingEdge.name', 'ru'),
      price: 4,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.whisperingEdge.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
    const { tempPlayer, isForChaos } = params;
    if (isForChaos) {
      return false;
    }
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);
    if (!player) {
      return false;
    }
    const wickedness = player.discard.getCardsByType(CryptozShared.ECardType.WICKEDNESS);
    if (!wickedness.count) {
      player.addEssenceOnTurn(this.getEssence(2, player));
      return true;
    }
    const selected = await this.room.socketService.selectCards({
      player,
      cards: wickedness,
      variants: [{ id: 1, value: t('cryptoz.modals.variants.take', 'ru') }],
      title: t('cryptoz.modals.title.takeWickednessFromDiscard', 'ru', {
        count: 1,
      }),
    });
    if (!selected.cards.count) {
      return false;
    }
    player.takeCardsToHand(selected.cards, player.discard);
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
