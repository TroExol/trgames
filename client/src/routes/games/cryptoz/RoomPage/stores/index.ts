import { RoomStore } from './RoomStore';
import { MessagesStore } from './MessagesStore';
import { LogsStore } from './LogsStore';
import { DialogStore } from './DialogStore';

export const roomStore = new RoomStore();
export const logsStore = new LogsStore();
export const messagesStore = new MessagesStore();
export const dialogStore = new DialogStore();
