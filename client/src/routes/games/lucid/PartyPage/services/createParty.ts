import type { Socket } from 'socket.io-client';

import { io } from 'socket.io-client';
import { LucidShared } from '@trgames/shared';

import { getLucidUrl } from '@/lib/constants';

// Своей комнаты для этого соединения ещё нет — партия ещё не создана,
// поэтому типов достаточно только на единственное событие лобби
type TLobbySocket = Socket<
  LucidShared.TLucidLobbyServerToClientEvents,
  LucidShared.TLucidLobbyClientToServerEvents
>;

export const createParty = (playerId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const socket = io(getLucidUrl('/lobby'), {
      query: { playerId },
      multiplex: false,
    }) as TLobbySocket;

    const finish = (): void => {
      socket.disconnect();
    };

    socket.on('connect_error', error => {
      finish();
      reject(new Error(error.message || 'Сервер недоступен'));
    });

    socket.on('connect', () => {
      socket.emit(LucidShared.ELucidEvent.createParty, result => {
        finish();

        if (result.status === 'ok') {
          resolve(result.partyId);
        } else {
          reject(new Error(result.message));
        }
      });
    });
  });
};
