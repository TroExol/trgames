import type { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { Logger } from '@/helpers/Logger';
import { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';

export class DarknessCrown {
  private readonly _room?: Room;
  private readonly logger: Logger;
  private isPlaying = false;
  private readonly description = t('cryptoz.darknessCrown.description', 'ru');
  public _ownerNickname?: string;
  public name = t('cryptoz.darknessCrown.name', 'ru');

  constructor(room?: Room) {
    this._room = room;
    this.logger = new Logger({ roomUuid: room?.uuid, gameName: room?.gameName, prefix: this.name });
  }

  public play = async () => {
    try {
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя разыграть: игра закончена');
        return;
      }
      if (!this.room.isGameStarted) {
        this.logger.warn('Нельзя разыграть: игра не началась');
        return;
      }
      if (!this.owner) {
        this.logger.warn('Нельзя разыграть: нет владельца');
        return;
      }
      if (this.isPlaying) {
        this.logger.warn('Нельзя разыграть: уже разыгрывается');
        return;
      }
      if (!this.owner.deck.count && !this.owner.discard.count) {
        this.logger.warn('Нельзя разыграть: участник не имеет карт в сбросе и личной стопке');
        return;
      }

      this.isPlaying = true;

      this.owner.takeCards(1);
      const selected = await this.room.socketService.selectCards({
        player: this.owner,
        cards: this.owner.hand,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
        title: t('cryptoz.modals.title.discardCardsFromHand.one', 'ru', {
          count: 1,
        }),
        canClose: false,
      });

      this.owner.discardHand(selected.cards);

      const message = t('cryptoz.logs.darknessCrownPlayed', 'ru', {
        nickname: this.owner.nickname,
      });
      this.room.addLog(message);
      this.owner.logger.info(message);
    } catch (error) {
      this.logger.error(`Ошибка разыгрывания короны Мрака: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка разыгрывания короны Мрака', error);
    } finally {
      this.isPlaying = false;
    }
  };

  public resetAttributes = () => {
    this.logger.info('Сбросила атрибуты');
    this.isPlaying = false;
  };

  public changeOwner(nickname?: string): void {
    if (nickname === this.ownerNickname) {
      return;
    }
    this.owner?.modifiersCountSeals.removeModifierById('DARKNESS_CROWN');
    this.logger.info(`Изменил владельца с ${this.ownerNickname} на ${nickname}`);
    this._ownerNickname = nickname;
    this.resetAttributes();
    this.owner?.modifiersCountSeals.addModifier(new CountSealsModifier('DARKNESS_CROWN', count => count + 1));
  }

  public format = (): CryptozShared.TDarknessCrown => {
    return {
      isPlaying: this.isPlaying,
      name: this.name,
      description: this.description,
    };
  };

  public get owner(): Player | null {
    if (!this.ownerNickname) {
      return null;
    }
    return this.room.players.getPlayerByNickname(this.ownerNickname);
  }

  public get ownerNickname(): typeof this._ownerNickname {
    return this._ownerNickname;
  }

  public get room() {
    if (!this._room) {
      this.logger.error('Комната не установлена');
      throw new Error('Комната не установлена');
    }
    return this._room;
  }
}
