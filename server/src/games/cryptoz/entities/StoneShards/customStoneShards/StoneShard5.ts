import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard5 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 5, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard5.description', 'ru');

  public canPlayHandler = () => !!this.owner && this.owner.deck.count > 0 && this.room.players.count > 1;

  protected playHandler = async () => {
    if (!this.owner) {
      return false;
    }

    const topCard = this.owner.deck.top;
    if (!topCard) {
      return false;
    }

    const otherPlayers = this.room.players.getPlayersExceptPlayer(this.owner);
    if (otherPlayers.count === 0) {
      return false;
    }

    this.room.socketService.showCards({
      players: otherPlayers,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      title: t('cryptoz.modals.title.showCardsFromPlayerTopDeck', 'ru', {
        count: 1,
        nickname: this.owner.nickname,
      }),
    });

    const { variant } = await this.room.socketService.selectCards<string>({
      player: this.owner,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      variants: otherPlayers.array.map(player => ({ id: player.nickname, value: player.nickname })),
      title: t('cryptoz.modals.title.giveCardsFromTopDeck', 'ru', { count: 1 }),
    });

    if (!variant) {
      return false;
    }

    const target = this.room.players.getPlayerByNickname(variant);
    if (!target) {
      return false;
    }

    target.takeCardsToDiscard(new CardGroup(ECardGroupType.ANY, [topCard]), this.owner.deck);

    return true;
  };

  protected onChangeOwner = () => {};
}
