import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard8 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 8, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard8.description', 'ru');

  public canPlayHandler = () => !!this.owner?.hand.count;

  protected playHandler = async () => {
    const owner = this.owner;
    if (!owner) {
      return false;
    }

    const { cards } = await this.room.socketService.selectCards({
      player: owner,
      cards: owner.hand,
      variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
      title: t('cryptoz.modals.title.discardCardsFromHand', 'ru', {
        count: 3,
      }),
      count: 3,
    });

    if (cards.count) {
      owner.discardHand(cards);
    }

    return true;
  };

  protected onChangeOwner = () => {};
}
