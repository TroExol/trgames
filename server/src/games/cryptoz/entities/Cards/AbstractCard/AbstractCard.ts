import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { Logger } from '@/helpers/Logger';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type {
  TCardConstructorParams,
  TCardEvadeHandlerParams,
  TCardPlayGeneralHandlerParams,
  TCardPlaySealHandlerParams,
  TCardPlayStrikeHandlerParams,
  TCardPlayTotalDarknessStrikeHandlerParams,
} from './types';

export abstract class AbstractCard {
  public readonly uuid: string = uuidv4();
  private readonly _room?: Room;
  public readonly logger: Logger;
  public readonly id: CryptozShared.ECardId;
  public readonly name: string;
  public readonly target: CryptozShared.ECardTarget;
  public readonly type: CryptozShared.ECardType;
  public readonly basePrice: number;
  public readonly baseGloryShards: number;
  public readonly baseEssence: number;
  public readonly hasEvade: boolean;
  public readonly isSeal: boolean;
  private isPlayingGeneral = false;
  private isPlayingSeal = false;
  private isPlayingStrike = false;
  private isPlayingEvade = false;
  private isPlayingTotalStrike = false;
  private _ownerNickname?: string;

  protected constructor({
    id,
    target,
    type,
    name,
    price,
    baseEssence,
    gloryShards,
    isSeal,
    room,
    hasEvade,
  }: TCardConstructorParams) {
    this._room = room;
    this.id = id;
    this.target = target;
    this.type = type;
    this.name = name;
    this.basePrice = price;
    this.baseEssence = baseEssence;
    this.baseGloryShards = gloryShards;
    this.isSeal = isSeal;
    this.logger = new Logger({ roomUuid: room?.uuid, gameName: room?.gameName, prefix: `Карта ${id}` });
    this.hasEvade = hasEvade;
  }

  public get room() {
    if (!this._room) {
      this.logger.error('Комната не установлена');
      throw new Error('Комната не установлена');
    }
    return this._room;
  }

  protected abstract getDescription(isSimple: boolean): CryptozShared.TCard['description'];

  private get isChaos(): boolean {
    return this.type === CryptozShared.ECardType.CHAOS;
  }

  public play = async (params:
    & TCardPlayGeneralHandlerParams
    & TCardPlaySealHandlerParams
    & TCardPlayStrikeHandlerParams = {},
  ): Promise<void> => {
    const { tempPlayer, isForChaos } = params;

    const player = tempPlayer ?? this.owner;

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
    if (!player?.isActive && !tempPlayer && !isForChaos && !this.isChaos) {
      this.logger.warn('Нельзя разыграть: участник не активный');
      return;
    }
    if (player?.arena.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
      this.logger.warn('Нельзя разыграть: уже разыграна и находится на арене');
      return;
    }
    if (player?.seals.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
      this.logger.warn('Нельзя разыграть: уже разыграна и находится в печатях');
      return;
    }
    if (!player?.hand.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
      this.logger.warn('Нельзя разыграть: нет в руке');
      return;
    }

    if (!tempPlayer && this.owner && !isForChaos && !this.isChaos && this.owner.hand.removeCard(this)) {
      if (this.isSeal) {
        this.owner.seals.addCardToTop(this);
      } else {
        this.owner.arena.addCardToTop(this);
      }
    }

    await this.playGeneral(params);
    await this.playStrike(params);
    await this.playSeal(params);

    if (!player || isForChaos || this.isChaos) {
      return;
    }

    player.playedCards.addCardToTop(this);
    player.triggersOnCardPlayed.apply(this);
  };

  public abstract canPlayGeneralHandler(params: TCardPlayGeneralHandlerParams): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
   *    return true;
   * };
   */
  protected abstract playGeneralHandler(params: TCardPlayGeneralHandlerParams): Promise<boolean>;

  // Start Утилиты для разыгрывания обычного свойства

  public playGeneral = async (params: TCardPlayGeneralHandlerParams = {}): Promise<void> => {
    const { tempPlayer, isForChaos } = params;

    const player = tempPlayer ?? this.owner;

    const checkConditionsToPlay = (): boolean => {
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя разыграть обычное свойство: игра завершена');
        return false;
      }
      if (!this.room.activePlayer) {
        this.logger.warn('Нельзя разыграть обычное свойство: нет активного участника');
        return false;
      }
      if (!player?.isActive && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть обычное свойство: участник не активный');
        return false;
      }
      if (this.isPlayingGeneral && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть обычное свойство: уже разыгрывается');
        return false;
      }
      if (!player?.arena.getCard(this) && !player?.seals.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть обычное свойство: нет на арене или в печатях');
        return false;
      }
      return true;
    };

    const onPlayed = (isPlayed: boolean) => {
      const message = player && !isForChaos && !this.isChaos
        ? t('cryptoz.logs.generalHandlerPlayedByPlayer', 'ru', {
            nickname: player.nickname,
            cardName: this.name,
          })
        : t('cryptoz.logs.generalHandlerPlayed', 'ru', {
            cardName: this.name,
          });
      this.room.addLog(message);

      if (isPlayed) {
        this.logger.info(player && !isForChaos && !this.isChaos ? `Участник ${player.nickname} разыграл обычное свойство` : 'Разыгралось обычное свойство');
      } else {
        this.logger.warn('Не разыгралось обычное свойство карты');
      }
    };

    try {
      if (!checkConditionsToPlay()) {
        return;
      }

      if (!this.canPlayGeneralHandler(params)) {
        this.logger.warn('Нельзя разыграть обычное свойство: canPlayGeneralHandler вернул false');
        onPlayed(false);
        return;
      }

      this.logger.info('Разыгрывается обычное свойство');
      this.isPlayingGeneral = true;

      const isPlayed = await this.playGeneralHandler(params);

      onPlayed(isPlayed);
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании обычного свойства карты: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании обычного свойства карты', error);
    } finally {
      this.isPlayingGeneral = false;
    }
  };

  // End Утилиты для разыгрывания печати
  public abstract canPlaySealHandler(params: TCardPlaySealHandlerParams): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playSealHandler = async (params: TCardPlaySealHandlerParams) => {
   *    return true;
   * };
   */
  protected abstract playSealHandler(params: TCardPlaySealHandlerParams): Promise<boolean>;

  // Start Утилиты для разыгрывания печати

  public playSeal = async (params: TCardPlaySealHandlerParams = {}): Promise<void> => {
    const { tempPlayer, isForChaos } = params;

    const player = tempPlayer ?? this.owner;

    const checkConditionsToPlay = (): boolean => {
      if (!this.isSeal) {
        return false;
      }
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя активировать печать: игра завершена');
        return false;
      }
      if (!this.room.activePlayer) {
        this.logger.warn('Нельзя активировать печать: нет активного участника');
        return false;
      }
      if (!player?.isActive && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя активировать печать: участник не активный');
        return false;
      }
      if (this.isPlayingSeal && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя активировать печать: уже разыгрывается');
        return false;
      }
      if (!player?.seals.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя активировать печать: нет в печатях');
        return false;
      }
      return true;
    };

    const onPlayed = (isPlayed: boolean) => {
      if (isPlayed) {
        this.logger.info(player && !isForChaos && !this.isChaos ? `Участник ${player.nickname} активировал печать` : 'Активировалась печать');
      } else {
        this.logger.warn('Не активировалась печать');
      }
    };

    try {
      if (!checkConditionsToPlay()) {
        return;
      }

      if (!this.canPlaySealHandler(params)) {
        this.logger.warn('Нельзя активировать печать: canPlaySealHandler вернул false');
        onPlayed(false);
        return;
      }

      this.logger.info('Активируется печать');
      this.isPlayingSeal = true;

      const isPlayed = await this.playSealHandler(params);

      onPlayed(isPlayed);
    } catch (error) {
      this.logger.error(`Ошибка при активации печати карты: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при активации печати карты', error);
    } finally {
      this.isPlayingSeal = false;
    }
  };

  // End Утилиты для разыгрывания печати

  public abstract canPlayStrikeHandler(params: TCardPlayStrikeHandlerParams): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playStrikeHandler = async (params: TCardPlayStrikeHandlerParams) => {
   *    return true;
   * };
   */
  protected abstract playStrikeHandler(params: TCardPlayStrikeHandlerParams): Promise<boolean>;

  // Start Утилиты для разыгрывания мракобоя

  public playStrike = async (params: TCardPlayStrikeHandlerParams = {}): Promise<void> => {
    const { tempPlayer, isForChaos, canEvade = true, force } = params;

    const player = tempPlayer ?? this.owner;

    const checkConditionsToPlay = (): boolean => {
      if (this.room.isGameEnded) {
        this.logger.warn('Нельзя разыграть мракобой: игра завершена');
        return false;
      }
      if (!this.room.activePlayer) {
        this.logger.warn('Нельзя разыграть мракобой: нет активного участника');
        return false;
      }
      if (!player?.isActive && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть мракобой: участник не активный');
        return false;
      }
      if (this.isPlayingStrike && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть мракобой: уже разыгрывается');
        return false;
      }
      if (!player?.arena.getCard(this) && !tempPlayer && !isForChaos && !this.isChaos) {
        this.logger.warn('Нельзя разыграть мракобой: нет на арене');
        return false;
      }
      return true;
    };

    const onPlayed = (isPlayed: boolean) => {
      const message = player && !isForChaos && !this.isChaos
        ? t('cryptoz.logs.strikeHandlerPlayedByPlayer', 'ru', {
            nickname: player.nickname,
            cardName: this.name,
          })
        : t('cryptoz.logs.strikeHandlerPlayed', 'ru', {
            cardName: this.name,
          });
      this.room.addLog(message);

      if (isPlayed) {
        this.logger.info(player && !isForChaos && !this.isChaos ? `Участник ${player.nickname} разыграл мракобой` : 'Разыгрался мракобой');
      } else {
        this.logger.warn('Не разыгрался мракобой карты');
      }
    };

    try {
      if (!checkConditionsToPlay()) {
        return;
      }

      if (!force && !this.canPlayStrikeHandler(params)) {
        this.logger.warn('Нельзя разыграть мракобой: canPlayStrikeHandler вернул false');
        onPlayed(false);
        return;
      }

      this.logger.info('Разыгрывается мракобой');
      this.isPlayingStrike = true;

      const isPlayed = await this.playStrikeHandler({ ...params, canEvade });

      onPlayed(isPlayed);
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании мракобоя карты: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании мракобоя карты', error);
    } finally {
      this.isPlayingStrike = false;
    }
  };

  // End Утилиты для разыгрывания мракобоя

  public abstract canPlayTotalDarknessStrikeHandler(params: TCardPlayTotalDarknessStrikeHandlerParams): boolean;

  /**
   * @return {boolean} true - успешно разыграна, false - не разыгралась
   * @example
   * protected playTotalDarknessStrikeHandler = async (params: TCardPlayTotalDarknessStrikeHandlerParams) => {
   *   this.room.players.array.forEach(player => player.takeDamage(3));
   *   return true;
   * };
   */
  protected abstract playTotalDarknessStrikeHandler(
    params: TCardPlayTotalDarknessStrikeHandlerParams
  ): Promise<boolean>;

  // Start Утилиты для разыгрывания тотального мракобоя

  public playTotalDarknessStrike = async (params: TCardPlayTotalDarknessStrikeHandlerParams = {}): Promise<void> => {
    try {
      if (!this.canPlayTotalDarknessStrikeHandler(params)) {
        this.room.addLog(t('cryptoz.logs.totalDarknessStrikePlayed', 'ru', {
          cardName: this.name,
        }));
        this.logger.warn('Нельзя разыграть тотальный мракобой: canPlayTotalDarknessStrikeHandler вернул false');
        return;
      }

      this.logger.info('Разыгрывается тотальный мракобой');
      this.isPlayingTotalStrike = true;

      const isPlayed = await this.playTotalDarknessStrikeHandler(params);

      this.room.addLog(t('cryptoz.logs.totalDarknessStrikePlayed', 'ru', {
        cardName: this.name,
      }));

      if (isPlayed) {
        this.logger.info('Разыгрался тотальный мракобой');
      } else {
        this.logger.warn('Не разыгралось свойство тотального мракобоя');
      }
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании тотального мракобоя карты: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании тотального мракобоя карты', error);
    } finally {
      this.isPlayingTotalStrike = false;
    }
  };

  // End Утилиты для разыгрывания тотального мракобоя

  public abstract canPlayEvadeHandler(params: TCardEvadeHandlerParams): boolean;

  /**
   * @example
   * public playEvadeHandler = async (params: TCardEvadeHandlerParams) => {
   *   const { attacker, damage } = params;
   *
   *   if (!this.owner) {
   *     return false;
   *   }
   *
   *   attacker.takeDamage(damage, this.owner);
   *   return true;
   * };
   */
  protected abstract playEvadeHandler(params: TCardEvadeHandlerParams): Promise<boolean>;

  // Start Утилиты для разыгрывания укрытия

  public playEvade = async (params: TCardEvadeHandlerParams): Promise<void> => {
    try {
      if (!this.owner) {
        this.logger.warn('Нельзя разыграть укрытие: нет владельца');
        return;
      }
      if (!this.hasEvade) {
        this.logger.warn('Нельзя разыграть укрытие: у карты нет укрытия');
        return;
      }
      const hasInHand = !!this.owner.hand.getCard(this);
      const hasInSeals = !!this.owner.seals.getCard(this);
      if (!hasInHand && !hasInSeals) {
        this.logger.warn('Нельзя разыграть укрытие: у владельца нет этой карты в руке или печатях');
        return;
      }
      const playingCardGroup = new CardGroup(ECardGroupType.ANY, [this]);
      if (hasInHand) {
        this.owner.discardHand(playingCardGroup);
      } else if (hasInSeals) {
        this.owner.discardSeal(playingCardGroup);
      }
      if (!this.canPlayEvadeHandler(params)) {
        this.logger.warn('Нельзя разыграть укрытие: canPlayEvadeHandler вернул false');
        return;
      }

      this.logger.info('Разыгрывается укрытие');
      this.isPlayingEvade = true;

      const isPlayed = await this.playEvadeHandler(params);

      this.room.addLog(t('cryptoz.logs.evadeHandlerPlayedByPlayer', 'ru', {
        nickname: this.ownerNickname ?? '',
        cardName: this.name,
      }));

      if (isPlayed) {
        this.logger.info('Разыгралось укрытие');
      } else {
        this.logger.warn('Не разыгралось укрытие');
      }
    } catch (error) {
      this.logger.error(`Ошибка при разыгрывании укрытия: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка при разыгрывании укрытия', error);
    } finally {
      this.isPlayingEvade = false;
    }
  };

  // End Утилиты для разыгрывания укрытия

  public getDamage = (damage: number, attacker: Player | null, target?: Player): number => {
    if (target) {
      damage = target.modifiersDamageToSelf.apply(damage, this);
    }
    if (attacker) {
      damage = attacker.modifiersDamageToOther.apply(damage, this);
    }
    return damage;
  };

  public getHeal = (hp: number, forPlayer: Player | null): number => {
    if (forPlayer) {
      hp = forPlayer.modifiersHeal.apply(hp);
    }
    return hp;
  };

  public getEssence = (essence: number, forPlayer: Player | null): typeof this.baseEssence => {
    if (forPlayer) {
      essence = forPlayer.modifiersCardEssence.apply(essence, this);
    }
    return essence;
  };

  public getPrice = (forPlayer: Player | null, price?: number): typeof this.basePrice => {
    let totalPrice = price ?? this.basePrice;
    if (forPlayer) {
      totalPrice = forPlayer.modifiersPrice.apply(totalPrice, this);
    }
    return totalPrice;
  };

  public getGloryShards = (forPlayer: Player | null, gloryShards?: number): typeof this.baseGloryShards => {
    let totalGloryShards = gloryShards ?? this.baseGloryShards;
    const forWhichPlayer = forPlayer ?? this.owner;
    if (forWhichPlayer) {
      totalGloryShards = forWhichPlayer.modifiersCardGloryShards.apply(totalGloryShards, this);
    }
    return totalGloryShards;
  };

  public resetAttributes(): void {
    this.logger.info('Сбросила атрибуты');
    this.isPlayingGeneral = false;
    this.isPlayingStrike = false;
    this.isPlayingEvade = false;
    this.isPlayingTotalStrike = false;
  }

  protected abstract onChangeOwner(prevOwner: Player | null, newOwner: Player | null): void;

  public changeOwner(nickname?: string): void {
    if (nickname === this.ownerNickname) {
      return;
    }
    const prevOwner = this.owner;
    this.logger.info(`Изменил владельца с ${this.ownerNickname} на ${nickname}`);
    this._ownerNickname = nickname;
    this.resetAttributes();
    this.onChangeOwner(prevOwner, this.owner);
  }

  public theSame = (card: AbstractCard) => {
    return this === card;
  };

  public theSameId = (id: CryptozShared.ECardId) => {
    return this.id === id;
  };

  public theSameType = (type: CryptozShared.ECardType) => {
    return this.type === type;
  };

  public theSameUuid = (uuid: string) => {
    return this.uuid === uuid;
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

  public get readableId(): string {
    return this.id + '_' + this.uuid;
  }

  public format(forPlayer?: Player | null): CryptozShared.TCard {
    return {
      uuid: this.uuid,
      id: this.id,
      readableId: this.readableId,
      name: this.name,
      description: this.getDescription(false),
      simpleDescription: this.getDescription(true),
      target: this.target,
      type: this.type,
      basePrice: this.basePrice,
      baseEssence: this.baseEssence,
      baseGloryShards: this.baseGloryShards,
      price: this.getPrice(forPlayer ?? null),
      essence: this.getEssence(this.baseEssence, forPlayer ?? null),
      gloryShards: this.getGloryShards(forPlayer ?? null),
      isSeal: this.isSeal,
      isPlayingGeneral: this.isPlayingGeneral,
      isPlayingStrike: this.isPlayingStrike,
      isPlayingEvade: this.isPlayingEvade,
      isPlayingTotalStrike: this.isPlayingTotalStrike,
      isPlayingSeal: this.isPlayingSeal,
      ownerNickname: this.ownerNickname,
    };
  }
}
