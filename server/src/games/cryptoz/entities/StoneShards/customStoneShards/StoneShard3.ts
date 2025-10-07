import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard3 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 3, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard3.description', 'ru');

  public canPlayHandler = () => !!this.owner?.discard.count;

  protected playHandler = async () => {
    if (!this.owner) {
      return false;
    }

    const { cards } = await this.room.socketService.selectCards({
      player: this.owner,
      cards: this.owner.discard,
      variants: [{ id: 1, value: t('cryptoz.modals.variants.remove', 'ru') }],
      title: t('cryptoz.modals.title.removeCardsFromDiscard', 'ru', { count: 1 }),
    });
    if (cards.count) {
      this.owner.removeCards(cards, 'discard');
    }
    return true;
  };

  protected onChangeOwner = () => {};
}
