import type { Socket } from 'socket.io-client';

import { toast } from 'sonner';
import { io } from 'socket.io-client';
import {
  CryptozShared,
  EAnalyticsEvent,
  EGame,
} from '@trgames/shared';

import type { TSocketServiceCreateRoomParams } from '@/routes/games/cryptoz/RoomsPage/services/types';

import { analyticsService } from '@/services';
import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { getApiUrl } from '@/lib/constants';

export class SocketService {
  public readonly socket: Socket<
    CryptozShared.TGeneralServerToClientEvents,
    CryptozShared.TGeneralClientToServerEvents
  >;

  constructor() {
    this.socket = io(
      getApiUrl(),
      { autoConnect: false },
    );

    this.socket.on('connect', () => {
      if (this.socket.recovered) {
        analyticsService.track(EAnalyticsEvent.WEBSOCKET_RECONNECTED, {
          game: EGame.CRYPTOZ,
        });
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('Подключение установлено');
      }
    });

    this.socket.on('connect_error', error => {
      if (error.message) {
        toast.error('Не удалось подключиться к серверу');
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Ошибка соединения с сервером', error);
      }
    });

    this.socket.on('disconnect', (reason, details) => {
      analyticsService.track(EAnalyticsEvent.WEBSOCKET_DISCONNECTED, {
        game: EGame.CRYPTOZ,
        reason,
      });
      if (!this.socket.active && process.env.NODE_ENV === 'development') {
        console.log('Соединение разорвано', reason, details);
      }
    });

    this.socket.on(CryptozShared.EGeneralEventTypes.updateRooms, rooms => {
      roomsStore.updateRooms(rooms);
    });

    this.socket.on(CryptozShared.EGeneralEventTypes.showToast, ({ message }) => {
      toast(message);
    });
  }

  public createRoom = async ({
    name,
    maxMarket,
    maxPlayers,
    roomPassword,
  }: TSocketServiceCreateRoomParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        CryptozShared.EGeneralEventTypes.createRoom,
        {
          name,
          maxMarket,
          maxPlayers,
          password: roomPassword,
        },
        params => {
          if (params.status === 'error') {
            reject(new Error(params.errorMessage));
            return;
          }
          analyticsService.track(CryptozShared.EAnalyticsEvent.ROOM_CREATED, {
            game: EGame.CRYPTOZ,
            roomId: params.uuid,
          });
          resolve(params.uuid);
        });
    });
  };

  public connect = (): void => {
    this.socket.connect();
  };

  public close = (): void => {
    this.socket.close();
  };
}
