import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class BanishTheCorruption extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.BANISH_THE_CORRUPTION,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.banishTheCorruption.name', 'ru'),
      price: 3,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.banishTheCorruption.description.general', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return false;
    }

    player.addEssenceOnTurn(this.getEssence(1, player));

    if (!player?.discard.count) {
      return true;
    }

    const { cards, variant } = await this.room.socketService.selectCards({
      player: player,
      cards: player.discard,
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.modals.title.mayRemoveCardsFromDiscard', 'ru', {
        count: 1,
      }),
    });

    if (!cards.count || variant === 2) {
      return true;
    }

    player.removeCards(cards, 'discard');
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
