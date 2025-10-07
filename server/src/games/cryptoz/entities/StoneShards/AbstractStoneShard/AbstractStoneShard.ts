import type { CryptozShared } from '@trgames/shared';

import { v4 as uuidv4 } from 'uuid';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { Logger } from '@/helpers/Logger';

import type { TStoneShardConstructorParams } from './types';

export abstract class AbstractStoneShard {
  public readonly uuid: string = uuidv4();
  private readonly _room?: Room;
  public readonly logger: Logger;
  public readonly id: CryptozShared.TStoneShardId;
  private _ownerNickname?: string;
  private isPlaying = false;

  protected constructor({
    id,
    room,
  }: TStoneShardConstructorParams) {
    this._room = room;
    this.id = id;
    this.logger = new Logger({ roomUuid: room?.uuid, gameName: room?.gameName, prefix: `Осколок Философского камня ${id}` });
  }

  public get room() {
    if (!this._room) {
      this.logger.error('Комната не установлена');
      throw new Error('Комната не установлена');
    }
    return this._room;
  }

  protected abstract getDescription(): string;

  public abstract canPlayHandler(killer: Player | null): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playHandler = async () => {
   *    return true;
   * };
   */
  protected abstract playHandler(killer: Player | null): Promise<boolean>;

  // Start Утилиты для разыгрывания

  public play = async (killer: Player | null): Promise<void> => {
    try {
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя разыграть: игра завершена');
        return;
      }
      if (!this.room.activePlayer) {
        this.logger.warn('Нельзя разыграть: нет активного участника');
        return;
      }
      if (this.isPlaying) {
        this.logger.warn('Нельзя разыграть: уже разыгрывается');
        return;
      }
      if (!this.owner) {
        this.logger.warn('Нельзя разыграть: нет владельца');
        return;
      }
      if (!this.owner.stoneShards.getStoneShard(this)) {
        this.logger.warn('Нельзя разыграть: у владельца нет этого осколка Философского камня');
        return;
      }
      if (!this.canPlayHandler(killer)) {
        this.logger.warn('Нельзя разыграть: canPlay вернул false');
        this.room.addLog(t('cryptoz.logs.stoneShardPlayed', 'ru', {
          nickname: this.ownerNickname ?? '',
        }));
        return;
      }

      this.logger.info('Разыгрывается');

      this.isPlaying = true;

      const isPlayed = await this.playHandler(killer);

      this.room.addLog(t('cryptoz.logs.stoneShardPlayed', 'ru', {
        nickname: this.ownerNickname ?? '',
      }));

      if (isPlayed) {
        this.logger.info('Разыгрался');
      } else {
        this.logger.warn('Не разыгрался');
      }
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании осколка Философского камня: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании осколка Философского камня', error);
    } finally {
      this.isPlaying = false;
    }
  };

  // End Утилиты для разыгрывания

  public theSame = (stoneShard: AbstractStoneShard) => {
    return this.uuid === stoneShard.uuid;
  };

  public theSameId = (id: CryptozShared.TStoneShardId) => {
    return this.id === id;
  };

  protected abstract onChangeOwner(prevOwner: Player | null, newOwner: Player | null): void;

  public changeOwner(nickname?: string): void {
    if (nickname === this.ownerNickname) {
      return;
    }
    const prevOwner = this.owner;
    this.logger.info(`Изменил владельца с ${this.ownerNickname} на ${nickname}`);
    this._ownerNickname = nickname;
    this.onChangeOwner(prevOwner, this.owner);
  }

  public get owner(): Player | null {
    if (!this.ownerNickname) {
      return null;
    }
    return this.room.players.getPlayerByNickname(this.ownerNickname);
  }

  public get ownerNickname(): typeof this._ownerNickname {
    return this._ownerNickname;
  }

  protected get readableId(): string {
    return this.id + '_' + this.uuid;
  }

  public format(): CryptozShared.TStoneShard {
    return {
      uuid: this.uuid,
      id: this.id,
      description: this.getDescription(),
      ownerNickname: this.ownerNickname,
    };
  }
}
