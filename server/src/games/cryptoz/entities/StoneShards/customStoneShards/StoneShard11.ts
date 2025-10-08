import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard11 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 11, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard11.description', 'ru');

  public canPlayHandler = () => !!this.owner?.hand.count;

  protected playHandler = () => {
    const owner = this.owner;
    if (!owner) {
      return Promise.resolve(false);
    }

    const randomCard = owner.hand.randomCard;
    if (!randomCard) {
      return Promise.resolve(false);
    }

    this.room.socketService.showEntities({
      players: this.room.playersAndViewers,
      cards: new CardGroup(ECardGroupType.ANY, [randomCard]),
      title: t('cryptoz.modals.title.randomDestroyedCardFromHand', 'ru', {
        nickname: owner.nickname,
      }),
    });

    owner.removeCards(new CardGroup(ECardGroupType.ANY, [randomCard]), 'hand');
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
