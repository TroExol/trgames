import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class MistEater extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.MIST_EATER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.mistEater.name', 'ru'),
      price: 4,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.mistEater.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    if (!player.deck.count) {
      player.fillDeck();
    }
    if (!player.deck.count) {
      return true;
    }

    const topCard = player.deck.top!;

    const { cards, variant } = await this.room.socketService.selectCards({
      player,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.take', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.remove', 'ru') },
      ],
      title: t('cryptoz.modals.title.showCardsFromTopDeck', 'ru', {
        count: 1,
      }),
    });

    if (!cards.count) {
      return false;
    }

    if (variant === 1) {
      player.takeCards(1);
    } else if (variant === 2) {
      player.removeCards(new CardGroup(ECardGroupType.ANY, [topCard]), 'deck');
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
