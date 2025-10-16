import type { Namespace, Server } from 'socket.io';

import { uid } from 'uid';
import { CryptozShared } from '@trgames/shared';

import { t } from '@/i18n';
import { FunctionResultObserver } from '@/helpers/FunctionResultObserver';
import { RoomGroup } from '@/games/cryptoz/entities/Rooms/RoomGroup';
import { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { PlayerGroup } from './entities/Players/PlayerGroup';

const createRoomNamespace = (io: Server, roomUuid: string, rooms: RoomGroup) => {
  // Неймспейс для всех комнат игры Криптоз
  const roomNamespace = io.of(`/cryptoz/room/${roomUuid}`) as Namespace<
    CryptozShared.TClientToServerEvents,
    CryptozShared.TServerToClientEvents
  >;

  roomNamespace.use((socket, next) => {
    const nickname = socket.handshake.query.nickname;
    const participant = socket.handshake.query.participant as 'viewer' | 'player' | undefined;
    const roomPassword = socket.handshake.query.roomPassword;

    if (typeof nickname !== 'string' || !nickname) {
      next(new Error(t('cryptoz.errors.noNickname', 'ru')));
      return;
    }
    if (nickname.length > 50) {
      next(new Error(t('cryptoz.errors.nicknameTooLong', 'ru')));
      return;
    }
    if (!participant) {
      next(new Error(t('cryptoz.errors.noUserType', 'ru')));
      return;
    }

    const room = rooms.getRoomByUuid(roomUuid);

    if (!room) {
      next(new Error(t('cryptoz.errors.roomNotFound', 'ru')));
      return;
    }
    if (room.settings.password && roomPassword !== room.settings.password) {
      next(new Error(t('cryptoz.errors.wrongPassword', 'ru')));
      return;
    }
    if (room.isGameEnded) {
      next(new Error(t('cryptoz.errors.gameEnded', 'ru')));
      return;
    }
    if (room.socketService.sockets.getSocketByNickname(nickname)) {
      next(new Error(t('cryptoz.errors.userAlreadyInRoom', 'ru')));
      return;
    }

    next();
  });

  // socket уникален для каждого клиента
  roomNamespace.on('connection', async socket => {
    const nickname = socket.handshake.query.nickname as string;
    const participant = socket.handshake.query.participant as 'viewer' | 'player';
    const room = rooms.getRoomByUuid(roomUuid)!;
    room.socketService.sockets.addSocket(nickname, socket);

    socket.use((_, next) => {
      const room = rooms.getRoomByUuid(roomUuid);

      if (!room) {
        next(new Error(t('cryptoz.errors.roomNotFound', 'ru')));
        return;
      }
      if (room.isGameEnded) {
        next(new Error(t('cryptoz.errors.gameEnded', 'ru')));
        return;
      }

      next();
    });

    socket.on('error', error => console.error(error));

    socket.on('disconnect', () => {
      const socketClient = room.socketService.sockets.getSocketByNickname(nickname);
      const isViewer = participant === 'viewer';
      if (!socketClient) {
        return;
      }
      const message = isViewer
        ? t('cryptoz.logs.viewerDisconnected', 'ru', { nickname })
        : t('cryptoz.logs.playerDisconnected', 'ru', { nickname });
      room.addLog(message);
      room.logger.info(message);
      room.socketService.sockets.removeSocketByNickname(nickname);
      if (!room.socketService.sockets.count) {
        room.removeRoom();
        rooms.removeRoom(room);
      }
    });

    try {
      if (participant === 'player') {
        await room.joinPlayer(nickname);
      } else if (participant === 'viewer') {
        room.joinViewer(nickname);
      } else {
        return;
      }
    } catch (error) {
      room.logger.error(`Ошибка подключения ${participant === 'player' ? 'участника' : 'зрителя'} ${nickname}: ${error instanceof Error ? error.message : error as string}`);
      console.error('Ошибка подключения участника', error);
      socket.disconnect();
      return;
    }

    socket.emit(CryptozShared.EEventTypes.sendMessages, room.messages.array.map(message => message.format()));
    socket.emit(CryptozShared.EEventTypes.sendLogs, room.logs.array.map(logs => logs.format()));

    socket.on(CryptozShared.EEventTypes.removePlayer, param => {
      try {
        if (room.adminNickname !== nickname) {
          room.logger.warn(`Не админ ${nickname} пытается удалить участника ${param}`);
          return;
        }

        const player = room.players.getPlayerByNickname(param);
        if (!player) {
          return;
        }
        room.removePlayer(player);
      } catch (error) {
        room.logger.error(`Ошибка удаления участника ${param}: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка удаления участника', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.sendMessage, message => {
      try {
        const sender = participant === 'player'
          ? room.players.getPlayerByNickname(nickname)
          : room.viewers.getPlayerByNickname(nickname);
        if (!sender) {
          return;
        }
        room.addMessage(message, sender);
      } catch (error) {
        room.logger.error(`Ошибка отправки сообщения "${message}" отправитель: ${nickname}: ${error instanceof Error ? error.message : error as string}`);
        console.error(`Ошибка отправки сообщения "${message}" отправитель: ${nickname}`, error);
      }
    });

    socket.on(CryptozShared.EEventTypes.buyHarbingerCard, () => {
      try {
        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается купить предвестника`);
          return;
        }

        room.activePlayer?.buyCard(CryptozShared.ECardType.HARBINGER);
      } catch (error) {
        room.logger.error(`Ошибка покупки предвестника: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка покупки предвестника', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.buyDarknessMadnessCard, () => {
      try {
        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается купить безумие тьмы`);
          return;
        }

        room.activePlayer?.buyCard(CryptozShared.ECardType.DARKNESS_MADNESS);
      } catch (error) {
        room.logger.error(`Ошибка покупки безумия тьмы: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка покупки безумия тьмы', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.buyCompanionCard, () => {
      try {
        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается купить помощника`);
          return;
        }

        room.activePlayer?.buyCard(CryptozShared.ECardType.COMPANION);
      } catch (error) {
        room.logger.error(`Ошибка покупки помощника: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка покупки помощника', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.buyMarketCard, param => {
      try {
        const card = room.market.getCardByUuid(param.uuid);
        if (!card) {
          room.logger.warn('Нельзя купить карту, которой нет на рынке');
          return;
        }
        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается купить карту с рынка`);
          return;
        }

        room.activePlayer?.buyCard(card.type, card);
      } catch (error) {
        room.logger.error(`Ошибка покупки карты с рынка: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка покупки карты с рынка', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.endTurn, async () => {
      try {
        if (!room.activePlayer) {
          room.logger.warn('Нельзя завершить ход: нет активного участника');
          return;
        }
        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается завершить ход`);
          return;
        }
        const leftPlayer = room.players.getLeftPlayer(room.activePlayer);
        if (room.players.count <= 1) {
          room.logger.warn('Нельзя завершить ход: нет других участников');
          return;
        }
        if (!leftPlayer) {
          room.logger.warn('Нельзя завершить ход: нет левого участника');
          return;
        }
        await room.endTurn(leftPlayer);
      } catch (error) {
        room.logger.error(`Ошибка окончания хода: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка окончания хода', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.removeRoom, () => {
      try {
        if (room.adminNickname !== nickname) {
          room.logger.warn(`Не админ ${nickname} пытается удалить комнату`);
          return;
        }
        room.removeRoom();
        rooms.removeRoom(room);
      } catch (error) {
        room.logger.error(`Ошибка удаления комнаты: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка удаления комнаты', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.toggleReady, () => {
      try {
        const player = room.players.getPlayerByNickname(nickname);
        if (!player) {
          room.logger.warn('Не участник пытается переключить готовность');
          return;
        }
        player.toggleIsReady();
      } catch (error) {
        room.logger.error(`Ошибка переключения готовности: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка переключения готовности', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.playCard, async param => {
      try {
        const card = room.players.getPlayerByNickname(nickname)?.hand.getCardByUuid(param.card.uuid);
        const target = (param.target?.nickname && room.players.getPlayerByNickname(param.target.nickname)) || undefined;

        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается сыграть карту`);
          return;
        }
        if (!card) {
          room.logger.warn('Нельзя сыграть карту, которой нет в руке');
          return;
        }
        if (room.socketService.pendingAck.size) {
          const nicknames = room.socketService.pendingAckNicknames.join(', ');
          room.logger.warn(`Нельзя разыграть: есть ожидающие действия других участников ${nicknames}`);
          if (room.activePlayer) {
            room.socketService.emitToPlayers(
              new PlayerGroup([room.activePlayer]),
              CryptozShared.EEventTypes.showToast, {
                message: t('cryptoz.errors.waitOtherPlayers', 'ru', { nicknames }),
              });
          }
          return;
        }

        await card.play({ concreteTarget: target });
      } catch (error) {
        room.logger.error(`Ошибка разыгрывания карты: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка разыгрывания карты', error);
      }
    });

    socket.on(CryptozShared.EEventTypes.playAbility, async param => {
      try {
        const ability = room.players.getPlayerByNickname(nickname)?.abilities.getAbilityByUuid(param.uuid);

        if (room.activePlayerNickname !== nickname) {
          room.logger.warn(`Не активный участник ${nickname} пытается сыграть способность`);
          return;
        }
        if (!ability) {
          room.logger.warn('Нельзя сыграть способность, которой нет у участника');
          return;
        }
        if (room.socketService.pendingAck.size) {
          const nicknames = room.socketService.pendingAckNicknames.join(', ');
          room.logger.warn(`Нельзя сыграть способность: есть ожидающие действия других участников ${nicknames}`);
          if (room.activePlayer) {
            room.socketService.emitToPlayers(
              new PlayerGroup([room.activePlayer]),
              CryptozShared.EEventTypes.showToast, {
                message: t('cryptoz.errors.waitOtherPlayers', 'ru', { nicknames }),
              });
          }
          return;
        }

        await ability.play();
      } catch (error) {
        room.logger.error(`Ошибка разыгрывания способности: ${error instanceof Error ? error.message : error as string}`);
        console.error('Ошибка разыгрывания способности', error);
      }
    });
  });

  return roomNamespace;
};

export const init = (io: Server) => {
  let countClients = 0;

  // Неймспейс игры Криптоз
  const gameNamespace = io.of(/^\/cryptoz$/) as Namespace<
    CryptozShared.TGeneralClientToServerEvents,
    CryptozShared.TGeneralServerToClientEvents
  >;
  const rooms = new RoomGroup();

  const roomsObserver = new FunctionResultObserver(
    () => {
      if (!countClients) {
        return [];
      }
      return rooms.rooms.map(room => room.formatShort());
    },
    () => {
      gameNamespace.emit(CryptozShared.EGeneralEventTypes.updateRooms, rooms.rooms.map(room => room.formatShort()));
    }, 2000);
  roomsObserver.startObserve();

  gameNamespace.on('connection', socket => {
    countClients++;

    socket.emit(CryptozShared.EGeneralEventTypes.updateRooms, rooms.rooms.map(room => room.formatShort()));

    socket.on('disconnect', () => {
      countClients--;
    });

    socket.on(CryptozShared.EGeneralEventTypes.createRoom, (params, callback) => {
      const checkRoomSettings = ({
        name,
        maxMarket,
        maxPlayers,
      }: {
        name: string;
        maxPlayers: number;
        maxMarket: number;
      }): string | null => {
        const formattedName = name.trim();
        if (!formattedName) {
          return t('cryptoz.errors.noRoomName', 'ru');
        }
        if (formattedName.length > 50) {
          return t('cryptoz.errors.roomNameTooLong', 'ru');
        }
        if (Number.isNaN(maxPlayers)) {
          return t('cryptoz.errors.noMaxPlayers', 'ru');
        }
        if (maxPlayers < 1 || maxPlayers > 8) {
          return t('cryptoz.errors.maxPlayersInvalid', 'ru');
        }
        if (Number.isNaN(maxMarket)) {
          return t('cryptoz.errors.noMaxMarket', 'ru');
        }
        if (maxMarket < 3 || maxMarket > 6) {
          return t('cryptoz.errors.maxMarketInvalid', 'ru');
        }
        return null;
      };

      try {
        const error = checkRoomSettings(params);
        if (error) {
          callback({ status: 'error', errorMessage: error });
          return;
        }

        const roomUuid = uid();
        const room = new Room({
          uuid: roomUuid,
          nsp: createRoomNamespace(io, roomUuid, rooms),
          name: params.name.trim(),
          settings: {
            maxPlayers: params.maxPlayers,
            maxMarket: params.maxMarket,
            password: params.password?.trim() || undefined,
          },
        });

        rooms.addRoom(room);
        callback({ status: 'ok', uuid: roomUuid });
      } catch (error) {
        console.error('Ошибка создания комнаты', params, error);
        callback({ status: 'error', errorMessage: t('cryptoz.errors.unknownError', 'ru') });
      }
    });
  });

  setInterval(() => {
    rooms.rooms.forEach(room => {
      if (!room.socketService.sockets.count && (Date.now() - room.createdAt) / 1000 > 60) {
        room.removeRoom();
        rooms.removeRoom(room);
      }
    });
  }, 30_000);
};
