import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class HorrorMauler extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.HORROR_MAULER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.horrorMauler.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.horrorMauler.description.evade', 'ru'),
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

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async () => {
    if (!this.owner) {
      return false;
    }

    this.owner.takeCards(1);

    const { cards, variant } = await this.room.socketService.selectCards({
      player: this.owner,
      cards: this.owner.hand,
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.modals.title.mayRemoveCardsFromHand', 'ru', {
        count: 1,
      }),
    });

    if (!cards.count || variant === 2) {
      return true;
    }

    this.owner.removeCards(cards, 'hand');

    return true;
  };
}
