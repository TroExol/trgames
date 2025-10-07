import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ArchitectOfIllusoryNets extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.ARCHITECT_OF_ILLUSORY_NETS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.architectOfIllusoryNets.name', 'ru'),
      price: 5,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.architectOfIllusoryNets.description.evade', 'ru'),
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

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async () => {
    const player = this.owner;
    if (!player) {
      return false;
    }
    player.takeCards(2);
    if (player.hand.count < 2) {
      return true;
    }
    const { cards } = await this.room.socketService.selectCards({
      player,
      cards: player.hand.getCardsFromTop(2).getCardsExceptCard(this),
      title: t('cryptoz.modals.title.discardCards', 'ru', {
        count: 1,
      }),
      variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
    });
    if (cards && cards.count) {
      player.discardHand(cards);
    }
    return true;
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
}
