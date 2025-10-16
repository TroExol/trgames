import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import type { AbilityGroup, EAbilityGroupType } from '@/games/cryptoz/entities/Abilities/AbilityGroup';

import { t } from '@/i18n';
import { Logger } from '@/helpers/Logger';
import { FunctionResultObserver } from '@/helpers/FunctionResultObserver';
import { SocketsService } from '@/games/cryptoz/services/SocketsService';
import { getInitialStoneShardMasterDeck } from '@/games/cryptoz/entities/StoneShards/utils';
import { PlayerGroup } from '@/games/cryptoz/entities/Players/PlayerGroup';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { MessageGroup } from '@/games/cryptoz/entities/Messages/MessageGroup';
import { Message } from '@/games/cryptoz/entities/Messages/Message';
import { LogGroup } from '@/games/cryptoz/entities/Logs/LogGroup';
import { Log } from '@/games/cryptoz/entities/Logs/Log';
import { DarknessCrown } from '@/games/cryptoz/entities/DarknessCrown';
import {
  getInitialCardMasterDeck,
  getInitialCompanions,
  getInitialCursedSeals,
  getInitialDarknessMadness,
  getInitialHarbingers,
} from '@/games/cryptoz/entities/Cards/utils';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { type AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';
import { getInitialAbilityMasterDeck } from '@/games/cryptoz/entities/Abilities/utils';

import type { TPlayChaosAdditionalParams, TRoomConstructorParams } from './types';

export class Room {
  public readonly uuid: string;
  public readonly name: string;
  public readonly gameName = t('cryptoz.name', 'ru');
  public readonly players = new PlayerGroup();
  public readonly viewers = new PlayerGroup();
  public readonly stoneShards: StoneShardGroup<EStoneShardGroupType.MASTER_DECK>;
  public readonly abilities: AbilityGroup<EAbilityGroupType.MASTER_DECK>;
  public readonly companions: CardGroup<ECardGroupType.ANY>;
  public readonly deck: CardGroup<ECardGroupType.MASTER_DECK>;
  public readonly market = new CardGroup(ECardGroupType.MARKET);
  public readonly harbingers: CardGroup<ECardGroupType.HARBINGERS>;
  public readonly cursedSeals: CardGroup<ECardGroupType.ANY>;
  public readonly darknessMadness: CardGroup<ECardGroupType.ANY>;
  public readonly darknessCrown: DarknessCrown;
  public readonly logs = new LogGroup();
  public readonly messages = new MessageGroup();
  public readonly removed = {
    cards: new CardGroup(ECardGroupType.ANY),
    chaos: new CardGroup(ECardGroupType.ANY),
  };
  public readonly socketService: SocketsService;
  public settings: CryptozShared.TRoomSettings;
  private readonly roomInfoObserver: FunctionResultObserver<typeof this.formatForAllPlayers>;
  public activeChaos: AbstractCard | undefined;
  public logger: Logger;
  public activePlayerNickname: string | undefined;
  public adminNickname: string | undefined;
  public isGameEnded = false;
  public isGameStarted = false;
  public createdAt = Date.now();
  public endedAt?: number;
  public startedAt?: number;

  constructor({
    uuid,
    name,
    nsp,
    settings,
  }: TRoomConstructorParams) {
    this.uuid = uuid;
    this.name = name;
    this.logger = new Logger({ roomUuid: this.uuid, gameName: this.gameName });
    this.socketService = new SocketsService({
      room: this,
      nsp,
    });
    this.darknessCrown = new DarknessCrown(this);
    this.settings = settings;

    this.deck = getInitialCardMasterDeck(this);
    this.companions = getInitialCompanions(this);
    this.harbingers = getInitialHarbingers({
      room: this,
      maxPlayers: settings.maxPlayers,
    });
    this.cursedSeals = getInitialCursedSeals({
      room: this,
      maxPlayers: settings.maxPlayers,
    });
    this.darknessMadness = getInitialDarknessMadness({
      room: this,
      maxPlayers: settings.maxPlayers,
    });
    this.abilities = getInitialAbilityMasterDeck(this);
    this.stoneShards = getInitialStoneShardMasterDeck({
      room: this,
      maxPlayers: settings.maxPlayers,
    });

    void this.fillMarket(false);
    this.roomInfoObserver = new FunctionResultObserver(this.formatForAllPlayers, this.sendInfo, 1000 / 20);
    this.roomInfoObserver.startObserve();
  }

  public endTurn = async (newActivePlayer: Player, force?: boolean): Promise<void> => {
    if (
      (this.isGameEnded
      || !this.isGameStarted
      || newActivePlayer.isActive
      || this.socketService.pendingAck.size)
      && !force
    ) {
      return;
    }

    // Конец хода

    const countCardsNeedFillMarket = this.settings.maxMarket - this.market.count;
    if (
      (countCardsNeedFillMarket > 0 && this.deck.count < countCardsNeedFillMarket)
      || !this.harbingers.count
      || !this.stoneShards.count
    ) {
      this.endGame();
      return;
    }

    if (this.activePlayer) {
      this.activePlayer.hand.array.forEach(card => this.activePlayer?.discard.addCardToTop(card));
      this.activePlayer.hand.clear();
      this.activePlayer.arena.array.forEach(card => this.activePlayer?.discard.addCardToTop(card));
      this.activePlayer.arena.clear();

      this.activePlayer.triggersOnTurnEnded.apply();

      this.activePlayer.fillHand();

      this.activePlayer.triggersOnHandFilledOnTurnEnd.apply();

      if (this.activePlayer.hasDarknessCrown) {
        await this.darknessCrown.play();
      }

      const message = t('cryptoz.logs.turnEnded', 'ru', { nickname: this.activePlayer.nickname });
      this.addLog(message);
      this.activePlayer.logger.info(message);
    }

    if (this.activePlayer?.boughtCards.getCardByType(CryptozShared.ECardType.HARBINGER)) {
      const topHarbinger = this.harbingers.top;

      if (topHarbinger) {
        this.socketService.emitToPlayers(
          this.playersAndViewers,
          CryptozShared.EEventTypes.showModalCards,
          {
            title: t('cryptoz.modals.title.totalDarknessStrike', 'ru'),
            cards: [topHarbinger.format()],
          },
        );

        await topHarbinger.playTotalDarknessStrike();
      }
    }

    // Начало хода

    this.activePlayerNickname = newActivePlayer.nickname;
    const message = t('cryptoz.logs.turnStarted', 'ru', { nickname: newActivePlayer.nickname });
    this.addLog(message);
    newActivePlayer.logger.info(message);

    this.players.array.forEach(player => player.resetAttributes());
    this.darknessCrown.resetAttributes();

    await this.fillMarket();

    newActivePlayer.triggersOnTurnStarted.apply();
  };

  public changeAdmin = (player: Player): void => {
    player.logger.info(`Участник ${player.nickname} стал админом`);
    this.adminNickname = player.nickname;
  };

  public joinPlayer = async (nickname: string): Promise<string | undefined> => {
    let player = this.players.getPlayerByNickname(nickname);
    let isNewPlayer = false;

    if (!player) {
      const newPlayer = new Player({
        nickname,
        room: this,
        participant: 'player',
      });

      if (this.isGameStarted) {
        const message = t('cryptoz.logs.gameAlreadyStarted', 'ru');
        newPlayer?.logger.warn(message);
        this.socketService.emitToPlayers(new PlayerGroup([newPlayer]), CryptozShared.EEventTypes.showToast, {
          message,
        });
        this.socketService.disconnect(newPlayer);
        return;
      }
      if (this.settings.maxPlayers <= this.players.count) {
        const message = t('cryptoz.logs.maxPlayersReached', 'ru');
        newPlayer?.logger.warn(message);
        this.socketService.emitToPlayers(new PlayerGroup([newPlayer]), CryptozShared.EEventTypes.showToast, {
          message,
        });
        this.socketService.disconnect(newPlayer);
        return;
      }

      this.players.addPlayerToBottom(newPlayer);
      player = newPlayer;
      isNewPlayer = true;
    }

    const message = t('cryptoz.logs.playerJoined', 'ru', { nickname });
    this.addLog(message);
    player.logger.info(message);

    if (!isNewPlayer) {
      return;
    }

    if (this.settings.maxPlayers > 4) {
      const randomCompanion = this.companions.randomCard;
      const randomAbility = this.abilities.randomAbility;

      if (!randomCompanion || !randomAbility) {
        player.logger.warn('Не удалось подобрать способность и помощника');
        return;
      }

      this.companions.removeCard(randomCompanion);
      this.abilities.removeAbility(randomAbility);

      randomCompanion.changeOwner(player.nickname);
      randomAbility.changeOwner(player.nickname);

      player.companion = randomCompanion;
      player.abilities.addAbilityToTop(randomAbility);

      player.logger.info('Присвоились случайные способность и помощника');
    } else {
      const selectResponse = await player.selectAbilityAndCompanion();

      if (!selectResponse) {
        this.removePlayer(player);
        player.logger.warn('Не удалось выбрать способность и помощника');
        return;
      }

      const { companion, ability } = selectResponse;

      companion.changeOwner(player.nickname);
      ability.changeOwner(player.nickname);

      player.companion = companion;
      player.abilities.addAbilityToTop(ability);

      player.logger.info('Выбрал способность и помощника');
    }

    if (!this.adminNickname) {
      player.logger.info(`Участник ${nickname} стал админом`);
      this.adminNickname = nickname;
    }
    if (!this.activePlayerNickname) {
      player.logger.info(`Участник ${nickname} стал активным участником`);
      this.activePlayerNickname = nickname;
    }
  };

  public joinViewer = (nickname: string): void => {
    let viewer = this.viewers.getPlayerByNickname(nickname);

    if (!viewer) {
      const newViewer = new Player({
        nickname,
        room: this,
        participant: 'viewer',
      });

      this.viewers.addPlayerToBottom(newViewer);
      viewer = newViewer;
    }

    const message = t('cryptoz.logs.viewerJoined', 'ru', { nickname });
    this.addLog(message);
    viewer.logger.info(message);
  };

  public removePlayer = (player: Player) => {
    if (!this.players.getPlayer(player)) {
      return;
    }
    const leftPlayer = this.players.getLeftPlayer(player);
    const isAdmin = player.isAdmin;
    const hasDarknessCrown = player.hasDarknessCrown;
    const isActive = player.isActive;
    this.players.removePlayer(player);

    if (leftPlayer) {
      if (isAdmin) {
        this.changeAdmin(leftPlayer);
      }
      if (hasDarknessCrown) {
        this.darknessCrown.changeOwner();
      }
      if (isActive) {
        void this.endTurn(leftPlayer, true);
      }
    }

    this.socketService.removePendingAcksByNickname(player.nickname);
    this.socketService.emitToPlayers(new PlayerGroup([player]), CryptozShared.EEventTypes.showToast, {
      message: t('cryptoz.logs.playerRemoved', 'ru', { nickname: player.nickname }),
    });
    this.socketService.disconnect(player);

    const message = t('cryptoz.logs.playerRemoved', 'ru', { nickname: player.nickname });
    this.addLog(message);
    player.logger.warn(message);
  };

  public endGame = (): void => {
    this.endedAt = Date.now();
    this.isGameEnded = true;
    this.players.array.forEach(player => {
      player.takeCardsToDiscard(player.deck, player.deck);
      player.takeCardsToDiscard(player.seals, player.seals);
      player.takeCardsToDiscard(player.hand, player.hand);
      player.takeCardsToDiscard(player.arena, player.arena);
    });
    // Сортировка по gloryShards, если gloryShards равны, то сортировка по предвестникам, иначе по stoneShards.count
    const players = [...this.players.array.map(player => player.format(player))]
      .sort((p1, p2) => p2.gloryShards! - p1.gloryShards!
        || (this.players.getPlayerByNickname(p2.nickname)?.discard
          .getCountCardsByType(CryptozShared.ECardType.HARBINGER) ?? 0)
          - (this.players.getPlayerByNickname(p1.nickname)?.discard
            .getCountCardsByType(CryptozShared.ECardType.HARBINGER) ?? 0)
        || p1.stoneShards.length - p2.stoneShards.length);
    this.socketService.emitToPlayers(this.playersAndViewers, CryptozShared.EEventTypes.showModalEndGame, {
      players,
    });
    const message = t('cryptoz.logs.winner', 'ru', { nickname: players[0].nickname });
    this.addLog(message);
    this.logger.info(message);
  };

  public fillMarket = async (canChaos = true): Promise<void> => {
    this.logger.info('Начали заполнять рынок');
    while (this.market.count < this.settings.maxMarket) {
      const card = this.deck.removeCardsFromTop(1).top;
      if (!card) {
        break;
      }

      if (card.theSameType(CryptozShared.ECardType.CHAOS)) {
        if (!canChaos) {
          this.deck.addCardToRandomPlace(card);
          continue;
        }

        if (this.activePlayer) {
          await this.playChaos(card);
        }

        this.removed.chaos.addCardToTop(card);
        continue;
      }

      this.logger.info('Добавлена карта на рынок');
      this.market.addCardToTop(card);
    }
    this.logger.info('Закончили заполнять рынок');
  };

  public playChaos = async (card: AbstractCard, params: TPlayChaosAdditionalParams = {}): Promise<void> => {
    const player = params.tempPlayer ?? this.activePlayer;
    if (!player) {
      return;
    }

    const message = t('cryptoz.logs.chaos', 'ru');
    this.addLog(message);
    this.logger.info(message);

    this.activeChaos = card;

    this.socketService.emitToPlayers(this.playersAndViewers, CryptozShared.EEventTypes.showModalCards, {
      cards: [card.format()],
    });

    await card.play({ tempPlayer: player, isForChaos: true, ...params });

    this.activeChaos = undefined;
  };

  public removeRoom = (): void => {
    const message = t('cryptoz.logs.removed', 'ru');
    this.socketService.emitToPlayers(this.playersAndViewers, CryptozShared.EEventTypes.showToast, {
      message,
    });
    this.logger.info(message);
    this.socketService.close();
    this.roomInfoObserver.stopObserve();
  };

  public addLog = (message: string): void => {
    this.logs.addLogToBottom(new Log(message));
    this.socketService
      .emitToPlayers(
        this.playersAndViewers,
        CryptozShared.EEventTypes.sendLogs,
        this.logs.array.slice(-50).map(log => log.format()),
      );
    this.socketService.emitToPlayers(this.playersAndViewers, CryptozShared.EEventTypes.showToast, { message });
  };

  public addMessage = (message: string, sender: Player): void => {
    this.messages.addMessageToBottom(new Message({ message, sender }));
    this.socketService
      .emitToPlayers(
        this.playersAndViewers,
        CryptozShared.EEventTypes.sendMessages,
        this.messages.array.slice(-50).map(message => message.format()),
      );
  };

  public get activePlayer(): Player | null {
    return this.activePlayerNickname
      ? this.players.getPlayerByNickname(this.activePlayerNickname)
      : null;
  }

  public get adminPlayer(): Player | null {
    return this.adminNickname
      ? this.players.getPlayerByNickname(this.adminNickname)
      : null;
  }

  public get playersAndViewers(): PlayerGroup {
    return new PlayerGroup(_.concat(this.players.array, this.viewers.array));
  }

  public sendInfo = (): void => {
    this.playersAndViewers.array.forEach(player => {
      this.socketService.emitToPlayers(
        new PlayerGroup([player]), CryptozShared.EEventTypes.updateRoom, this.format(player),
      );
    });
  };

  public formatForAllPlayers = (): ReturnType<typeof this.format>[] => {
    return this.players.array.map(player => this.format(player));
  };

  public format = (forPlayer: Player): CryptozShared.TRoom => {
    return {
      uuid: this.uuid,
      darknessCrown: this.darknessCrown.format(),
      activeChaos: this.activeChaos?.format(),
      activePlayerNickname: this.activePlayerNickname,
      adminNickname: this.adminNickname,
      countDeck: this.deck.count,
      playerNickname: forPlayer.nickname,
      isGameEnded: this.isGameEnded,
      endedAt: this.endedAt,
      isGameStarted: this.isGameStarted,
      startedAt: this.startedAt,
      countViewers: this.viewers.count,
      countHarbingers: this.harbingers.count,
      harbinger: this.activePlayer?.boughtCards.getCardByType(CryptozShared.ECardType.HARBINGER)
        ? undefined
        : this.harbingers.top?.format(this.activePlayer),
      name: this.name,
      players: this.players.array.map(player => player.format(forPlayer)),
      abilities: this.abilities.array.map(card => card.format()),
      removed: {
        cards: this.removed.cards.array.map(card => card.format()),
        chaos: this.removed.chaos.array.map(card => card.format()),
      },
      market: this.market.array.map(card => card.format(this.activePlayer)),
      stoneShards: this.stoneShards.array.map(card => card.format()),
      darknessMadness: this.darknessMadness.array.map(card => card.format(this.activePlayer)),
      cursedSeal: this.cursedSeals.array.map(card => card.format()),
      pendingAckNicknames: this.socketService.pendingAckNicknames,
    };
  };

  public formatShort = (): CryptozShared.TRoomShort => {
    return {
      uuid: this.uuid,
      name: this.name,
      playerNicknames: _.map(this.players.array, 'nickname'),
      countViewers: this.viewers.count,
      countOnlinePlayers: this.socketService.sockets.count,
      settings: {
        maxPlayers: this.settings.maxPlayers,
        maxMarket: this.settings.maxMarket,
      },
      isWithPassword: !!this.settings.password,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      isGameStarted: this.isGameStarted,
      isGameEnded: this.isGameEnded,
    };
  };
}
