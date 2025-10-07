import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractStoneShard } from '../AbstractStoneShard';

export class StoneShard7 extends AbstractStoneShard {
  constructor(room?: Room) {
    super({ id: 7, room });
  }

  protected getDescription = () => t('cryptoz.stoneShards.stoneShard7.description', 'ru');

  public canPlayHandler = () => !!this.owner && this.room.players.count > 1;

  protected playHandler = async () => {
    const owner = this.owner;
    if (!owner) {
      return false;
    }

    const enemies = this.room.players.getPlayersExceptPlayer(owner);
    if (enemies.count === 0) {
      return false;
    }

    await Promise.allSettled(enemies.array.map(async enemy => {
      if (enemy.discard.count === 0) {
        return;
      }

      const { cards } = await this.room.socketService.selectCards({
        player: enemy,
        cards: enemy.discard,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.give', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
        ],
        title: t('cryptoz.modals.title.mayGiveCardsFromDiscardToPlayer', 'ru', {
          nickname: owner.nickname,
          count: 1,
        }),
      });

      if (!cards.count) {
        return;
      }

      owner.takeCardsToDiscard(cards, enemy.discard);
      this.room.addLog(t('cryptoz.logs.gaveCardToPlayer', 'ru', {
        nicknameFrom: enemy.nickname,
        cardName: cards.top!.name,
        nicknameTo: owner.nickname,
      }));
    }));

    return true;
  };

  protected onChangeOwner = () => {};
}
