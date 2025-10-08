import type { EventParams } from 'socket.io/dist/typed-events';

import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import type { Player } from '@/games/cryptoz/entities/Players/Player';
import type { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import { t } from '@/i18n';
import { SocketGroup } from '@/helpers/SocketGroup';
import { toPlayerVariant } from '@/games/cryptoz/helpers/utils';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import type {
  TNamespace,
  TSelectAbilityAndCompanionParams,
  TSelectAbilityAndCompanionResult,
  TSelectCardsParams,
  TSelectCardsResult,
  TSelectEvadeCardParams,
  TSelectStoneShardsParams,
  TSelectStoneShardsResult,
  TSelectTargetParams,
  TSelectVariantParams,
  TSelectVariantResult,
  TShowCardsParams,
  TShowEntitiesParams,
  TSocket,
  TSocketsServiceConstructorParams,
} from './types';

export class SocketsService {
  private readonly nsp: TNamespace;
  private readonly room: Room;
  public readonly sockets = new SocketGroup<TSocket>();
  public readonly pendingAck = new Map<string, string>();

  constructor({ room, nsp }: TSocketsServiceConstructorParams) {
    this.nsp = nsp;
    this.room = room;
  }

  public close = (): void => {
    this.nsp.disconnectSockets();
  };

  public disconnect = (player: Player): void => {
    this.sockets.getSocketByNickname(player.nickname)?.disconnect();
    this.removePendingAcksByNickname(player.nickname);
    this.sockets.removeSocketByNickname(player.nickname);
  };

  public emitToPlayers = <T extends keyof CryptozShared.TServerToClientWithoutAckEvents>(
    players: PlayerGroup,
    event: T,
    ...params: EventParams<CryptozShared.TServerToClientWithoutAckEvents, T>
  ): void => {
    players.array.forEach(player => this.sockets.getSocketByNickname(player.nickname)?.emit(event, ...params));
  };

  public emitWithAck = async <T extends keyof CryptozShared.TServerToClientWithAckEvents>(
    player: Player,
    event: T,
    params: EventParams<CryptozShared.TServerToClientWithAckEvents, T>[0],
  ): Promise<Parameters<EventParams<CryptozShared.TServerToClientWithAckEvents, T>[1]>[0]> => {
    return new Promise((resolve, reject) => {
      const isPlayerExists = this.room.players.getPlayer(player);

      if (!isPlayerExists) {
        player.logger.warn('Нет в игре, невозможно выполнить запрос с колбэком');
        reject(new Error(`Участника ${player.nickname} нет в игре`));
        return;
      }

      const socketId = this.sockets.getSocketByNickname(player.nickname)?.id;
      const ackUuid = uuidv4();

      const interval = setInterval(() => {
        const isPlayerExistsWhileInterval = this.room.players.getPlayer(player);

        if (!isPlayerExistsWhileInterval) {
          clearInterval(interval);
          player.logger.warn('Нет в игре, невозможно выполнить запрос с колбэком');
          this.removePendingAck(ackUuid);
          reject(new Error(`Участника ${player.nickname} нет в игре`));
          return;
        }

        const socket = this.sockets.getSocketByNickname(player.nickname);

        if (socket?.id === socketId) {
          return;
        }

        clearInterval(interval);
        const newEmitWithAck = this.emitWithAck(player, event, params);
        this.removePendingAck(ackUuid);
        newEmitWithAck
          .then(response => resolve(response))
          .catch(error => reject(error as Error));
      }, 1000);

      type TCallback = (
        response: Parameters<EventParams<CryptozShared.TServerToClientWithAckEvents, T>[1]>[0]
      ) => void;

      const callback: TCallback = response => {
        clearInterval(interval);
        this.removePendingAck(ackUuid);
        resolve(response);
      };
      const args = [params, callback] as Parameters<CryptozShared.TServerToClientEvents[T]>;

      this.addPendingAck(ackUuid, player);

      this.sockets.getSocketByNickname(player.nickname)?.emit(event, ...args);
    });
  };

  public showCards = ({
    players,
    cards,
    title,
    cardsSubtitle,
  }: TShowCardsParams): void => {
    try {
      void this.emitToPlayers(players, CryptozShared.EEventTypes.showModalCards, {
        cards: cards.array.map(card => card.format()),
        cardsSubtitle,
        title,
      });
    } catch (error) {
      this.room.logger.error(`Ошибка показа карт: ${error instanceof Error ? error.message : error as string}`);
    }
  };

  public showEntities = ({
    players,
    title,
    cards,
    cardsSubtitle,
    stoneShards,
    abilities,
    canClose,
    canCollapse,
  }: TShowEntitiesParams): void => {
    if (!cards?.count && !stoneShards?.count && !abilities?.count) {
      return;
    }

    try {
      void this.emitToPlayers(players, CryptozShared.EEventTypes.showModalEntities, {
        title,
        cards: cards?.array.map(card => card.format()),
        cardsSubtitle,
        stoneShards: stoneShards?.array.map(stoneShard => stoneShard.format()),
        abilities: abilities?.array.map(ability => ability.format()),
        canClose,
        canCollapse,
      });
    } catch (error) {
      this.room.logger.error(`Ошибка показа сущностей: ${error instanceof Error ? error.message : error as string}`);
    }
  };

  public selectCards = async <T extends string | number = string | number>({
    player,
    cards,
    variants,
    title,
    cardsSubtitle,
    count = 1,
    canClose = false,
  }: TSelectCardsParams<T>): Promise<TSelectCardsResult<T>> => {
    try {
      if (variants.length <= 1) {
        // Если доступно для выбора любое кол-во, но всего карт <= 1, то выбираем все
        if (count === null && cards.count <= 1) {
          return { cards, variant: variants[0]?.id };
        // Если нужно выбрать определенное кол-во, но оно превышает кол-во карт, то выбираем все
        } else if (count !== null && cards.count <= count) {
          return { cards, variant: variants[0]?.id };
        }
      }

      const selectedCards = new CardGroup(ECardGroupType.ANY);
      let totalCount: number | null = null;
      if (count !== null) {
        totalCount = count < cards.count
          ? count
          : 0;
      }

      const params = await this.emitWithAck(player, CryptozShared.EEventTypes.showModalSelectCards, {
        cards: cards.array.map(card => card.format()),
        count: totalCount,
        cardsSubtitle,
        variants,
        title,
        canClose,
      });

      if (params.closed) {
        return { cards: selectedCards };
      }

      const { variant: v, selectedCards: cardsFromClient } = params;
      const variant = v as T;

      if (totalCount === 0) {
        return {
          cards,
          variant,
        };
      }

      cardsFromClient.forEach(c => {
        const card = cards.getCardByUuid(c.uuid);
        if (card) {
          selectedCards.addCardToBottom(card);
        }
      });

      return {
        cards: selectedCards,
        variant,
      };
    } catch (error) {
      player.logger.error(`Ошибка выбора карт: ${error instanceof Error ? error.message : error as string}`);
      return { cards: new CardGroup(ECardGroupType.ANY) };
    }
  };

  public selectEvadeCard = async ({
    player,
    title,
    cards,
    cardAttack,
    cardsToShow,
    canClose = false,
  }: TSelectEvadeCardParams): Promise<AbstractCard | null> => {
    try {
      const params = await this.emitWithAck(player, CryptozShared.EEventTypes.showModalSuggestEvade, {
        cardAttack: cardAttack.format(),
        cardsToShow: cardsToShow?.array.map(card => card.format()),
        cards: cards.array.map(card => card.format()),
        title,
        canClose,
        variants: [
          { id: 1, value: t('cryptoz.modals.variants.evade', 'ru') },
          { id: 2, value: t('cryptoz.modals.variants.notEvade', 'ru') },
        ],
      });

      if (params.closed || params.variant === 2 || !params.selectedCard) {
        return null;
      }

      return cards.getCardByUuid(params.selectedCard.uuid);
    } catch (error) {
      player.logger.error(`Ошибка выбора карты укрытия: ${error instanceof Error ? error.message : error as string}`);
      return null;
    }
  };

  public selectStoneShards = async ({
    player,
    stoneShards,
    variants,
    title,
    count = 1,
    canClose = false,
  }: TSelectStoneShardsParams): Promise<TSelectStoneShardsResult> => {
    try {
      if (stoneShards.count <= count && variants.length <= 1) {
        return { stoneShards, variant: variants[0]?.id };
      }

      const selectedStoneShards = new StoneShardGroup(EStoneShardGroupType.ANY);
      const totalCount = count < stoneShards.count
        ? count
        : 0;

      const params = await this.emitWithAck(player, CryptozShared.EEventTypes.showModalSelectStoneShards, {
        stoneShards: stoneShards.array.map(stoneShards => stoneShards.format()),
        count: totalCount,
        variants,
        title,
        canClose,
      });

      if (params.closed) {
        return { stoneShards: selectedStoneShards };
      }

      const { variant, selectedStoneShards: stoneShardsFromClient } = params;

      if (totalCount === 0) {
        return {
          stoneShards,
          variant,
        };
      }

      stoneShardsFromClient.forEach(s => {
        const stoneShard = stoneShards.getStoneShardByUuid(s.uuid);
        if (stoneShard) {
          selectedStoneShards.addStoneShardToBottom(stoneShard);
        }
      });

      return {
        stoneShards: selectedStoneShards,
        variant,
      };
    } catch (error) {
      player.logger.error(`Ошибка выбора осколков Философского камня: ${error instanceof Error ? error.message : error as string}`);
      return { stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY) };
    }
  };

  public selectTarget = async ({
    player,
    targetsToSelect,
    title,
    canClose = false,
  }: TSelectTargetParams): Promise<Player | null> => {
    try {
      const players = targetsToSelect ?? this.room.players.getPlayersExceptPlayer(player);
      if (!players.count) {
        return null;
      }
      if (players.count === 1) {
        return players.array[0];
      }
      const selectedTarget = await this.selectVariant<string>({
        player,
        variants: players.array.map(toPlayerVariant),
        title: title ?? t('cryptoz.modals.title.chooseStrikeTarget', 'ru'),
        canClose,
      });
      if (!selectedTarget) {
        return null;
      }
      return this.room.players.getPlayerByNickname(selectedTarget);
    } catch (error) {
      player.logger.error(`Ошибка выбора участника: ${error instanceof Error ? error.message : error as string}`);
      return null;
    }
  };

  public selectVariant = async <T extends CryptozShared.TVariant<string | number>['id']>({
    player,
    variants,
    title,
    canClose = false,
  }: TSelectVariantParams<T>): Promise<TSelectVariantResult<T>> => {
    try {
      if (variants.length <= 1) {
        return variants[0]?.id;
      }

      const params = await this.emitWithAck(player, CryptozShared.EEventTypes.showModalSelectVariant, {
        variants,
        title,
        canClose,
      });

      if (params.closed || params.variant === undefined) {
        return null;
      }

      return params.variant as T;
    } catch (error) {
      player.logger.error(`Ошибка выбора варианта: ${error instanceof Error ? error.message : error as string}`);
      return null;
    }
  };

  public selectAbilityAndCompanion = async ({
    player,
    companions,
    abilities,
  }: TSelectAbilityAndCompanionParams): Promise<TSelectAbilityAndCompanionResult | null> => {
    try {
      if (!companions.count && !abilities.count) {
        return null;
      }
      if (companions.count === 1 && abilities.count === 1) {
        return { ability: abilities.bottom!, companion: companions.bottom! };
      }

      const res = await this.emitWithAck(player, CryptozShared.EEventTypes.showModalSelectStartCards, {
        canClose: false,
        canCollapse: false,
        companions: companions.array.map(card => card.format()),
        abilities: abilities.array.map(ability => ability.format()),
      });

      const selectedAbility = abilities.getAbilityByUuid(res.ability.uuid);
      const selectedCompanion = companions.getCardByUuid(res.companion.uuid);

      if (!selectedAbility || !selectedCompanion) {
        return null;
      }

      return {
        ability: selectedAbility,
        companion: selectedCompanion,
      };
    } catch (error) {
      player.logger.error(`Ошибка выбора способности и помощника: ${error instanceof Error ? error.message : error as string}`);
      return null;
    }
  };

  public addPendingAck = (uuid: string, player: Player) => {
    this.pendingAck.set(uuid, player.nickname);
  };

  public removePendingAck = (uuid: string) => {
    this.pendingAck.delete(uuid);
  };

  public removePendingAcksByNickname = (nickname: string) => {
    for (const pendingAck of this.pendingAck.entries()) {
      if (pendingAck[1] === nickname) {
        this.pendingAck.delete(pendingAck[0]);
      }
    }
  };

  public get pendingAckNicknames() {
    return [...new Set(this.pendingAck.values())];
  }
}
