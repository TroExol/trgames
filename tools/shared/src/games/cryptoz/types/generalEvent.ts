import type { TRoomSettings, TRoomShort } from './room';

export enum EGeneralEventTypes {
  createRoom = 'create-room',
  showToast = 'show-toast',
  updateRooms = 'update-rooms',
}

export interface TGeneralServerToClientWithoutAckEvents {
  [EGeneralEventTypes.updateRooms]: (rooms: TRoomShort[]) => void;
  [EGeneralEventTypes.showToast]: (params: { message: string }) => void;
}

export type TGeneralServerToClientEvents = TGeneralServerToClientWithoutAckEvents;

export interface TGeneralClientToServerEvents {
  [EGeneralEventTypes.createRoom]: (
    params: { name: string } & TRoomSettings,
    callback: (params: { status: 'ok'; uuid: string } | { status: 'error'; errorMessage: string }) => void
  ) => void;
}
