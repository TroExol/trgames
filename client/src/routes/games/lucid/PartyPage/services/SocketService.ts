import type { Socket } from 'socket.io-client';

import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { getLucidUrl } from '@/lib/constants';

interface TConnectParams {
  partyId: string;
  playerId: string;
  nickname: string;
}

type TSocket = Socket<
  LucidShared.TLucidServerToClientEvents,
  LucidShared.TLucidClientToServerEvents
>;

export class SocketService {
  private socket: TSocket | undefined;

  public connect = ({ partyId, playerId, nickname }: TConnectParams): void => {
    this.disconnect();

    this.socket = io(getLucidUrl(), {
      query: { partyId, playerId, nickname },
      multiplex: false,
    }) as TSocket;

    this.socket.on('connect', () => partyStore.setConnection('online'));
    this.socket.on('disconnect', () => partyStore.setConnection('offline'));

    this.socket.on('connect_error', error => {
      partyStore.setConnection('offline');
      partyStore.setError(error.message || 'Не удалось подключиться к партии');
    });

    this.socket.on(LucidShared.ELucidEvent.updateParty, view => partyStore.applyView(view));
    this.socket.on(LucidShared.ELucidEvent.appendRibbon, lines => partyStore.appendRibbon(lines));

    // Отказ по существу возможен только один: клиент отстал на версию и успел
    // нажать. Правильный ответ там — свежее состояние, оно придёт следом
    this.socket.on(LucidShared.ELucidEvent.showError, ({ message }) => toast.error(message));
  };

  public disconnect = (): void => {
    this.socket?.disconnect();
    this.socket = undefined;
  };

  public proposeTheme = (theme: string): void => {
    this.socket?.emit(LucidShared.ELucidEvent.proposeTheme, theme);
  };

  public declineTheme = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.declineTheme);
  };

  public startParty = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.startParty);
  };

  public makeMove = (move: LucidShared.TMove): void => {
    this.socket?.emit(LucidShared.ELucidEvent.makeMove, move);
  };

  public playAgain = (): void => {
    this.socket?.emit(LucidShared.ELucidEvent.playAgain);
  };
}

export const socketService = new SocketService();
