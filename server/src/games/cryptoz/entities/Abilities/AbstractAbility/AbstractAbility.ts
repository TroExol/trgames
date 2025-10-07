import type { CryptozShared } from '@trgames/shared';

import { v4 as uuidv4 } from 'uuid';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { Logger } from '@/helpers/Logger';

import type { TAbilityConstructorParams } from './types';

export abstract class AbstractAbility {
  public readonly uuid = uuidv4();
  private readonly _room?: Room;
  public readonly id: CryptozShared.TAbilityId;
  public readonly logger: Logger;
  private isPlayed = false;
  private isPlaying = false;
  private _ownerNickname?: string;

  protected constructor({
    id,
    room,
  }: TAbilityConstructorParams) {
    this._room = room;
    this.id = id;
    this.logger = new Logger({ roomUuid: room?.uuid, gameName: room?.gameName, prefix: `Способность ${id}` });
  }

  public get room() {
    if (!this._room) {
      this.logger.error('Комната не установлена');
      throw new Error('Комната не установлена');
    }
    return this._room;
  }

  protected abstract getDescription(): string;

  public abstract canPlayHandler(): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playHandler = async () => {
   *    return true;
   * };
   */
  protected abstract playHandler(): Promise<boolean>;

  // Start Утилиты для разыгрывания

  public play = async (): Promise<void> => {
    try {
      if (!this.room.isGameStarted) {
        this.logger.warn('Нельзя разыграть: игра не начата');
        return;
      }
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя разыграть: игра завершена');
        return;
      }
      if (!this.room.activePlayer) {
        this.logger.warn('Нельзя разыграть: нет активного участника');
        return;
      }
      if (!this.owner?.isActive) {
        this.logger.warn('Нельзя разыграть: участник не активный');
        return;
      }
      if (!this.owner.abilities.getAbility(this)) {
        this.logger.warn('Нельзя разыграть: у участника нет этой способности');
        return;
      }
      if (this.isPlaying) {
        this.logger.warn('Нельзя разыграть: уже разыгрывается');
        return;
      }
      if (this.isPlayed) {
        this.logger.warn('Нельзя разыграть: уже разыграно');
        return;
      }
      if (!this.canPlayHandler()) {
        this.logger.warn('Нельзя разыграть: canPlayHandler вернул false');
        return;
      }

      this.logger.info('Разыгрывается');
      this.isPlaying = true;

      const isPlayed = await this.playHandler();

      this.room.addLog(t('cryptoz.logs.abilityPlayed', 'ru', {
        nickname: this.ownerNickname ?? '',
      }));
      this.isPlayed = true;

      if (isPlayed) {
        this.logger.info('Разыгралась');
      } else {
        this.logger.warn('Не разыгралась');
      }
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании способности: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании способности', error);
    } finally {
      this.isPlaying = false;
    }
  };

  // End Утилиты для разыгрывания

  public resetAttributes(): void {
    this.logger.info('Сбросила атрибуты');
    this.isPlaying = false;
    this.isPlayed = false;
  }

  protected abstract onChangeOwner(prevOwner: Player | null, newOwner: Player | null): void;

  public changeOwner(nickname?: string): void {
    if (nickname === this.ownerNickname) {
      return;
    }
    const prevOwner = this.owner;
    this.logger.info(`Изменила владельца с ${this.ownerNickname} на ${nickname}`);
    this._ownerNickname = nickname;
    this.resetAttributes();
    this.onChangeOwner(prevOwner, this.owner);
  }

  public theSame = (ability: AbstractAbility) => {
    return this.uuid === ability.uuid;
  };

  public theSameId = (id: CryptozShared.TAbilityId) => {
    return this.id === id;
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

  protected get readableId(): string {
    return this.id + '_' + this.uuid;
  }

  public format(): CryptozShared.TAbility {
    return {
      uuid: this.uuid,
      id: this.id,
      description: this.getDescription(),
      canPlayHandler: this.canPlayHandler(),
      isPlaying: this.isPlaying,
      isPlayed: this.isPlayed,
      ownerNickname: this.ownerNickname,
    };
  }
}
