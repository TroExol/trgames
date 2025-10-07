import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChroniclerOfWhirls extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHRONICLER_OF_WHIRLS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.chroniclerOfWhirls.name', 'ru'),
      price: 3,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chroniclerOfWhirls.description.general', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(1, player));

    const isFirstCardOnTurn = player.playedCards.count === 0;

    if (isFirstCardOnTurn) {
      player.discardHand(player.hand);
      player.takeCards(4);
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
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = () => Promise.resolve(false);
}
