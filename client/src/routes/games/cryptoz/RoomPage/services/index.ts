import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';

import { SocketService } from './SocketService';
import { DialogService } from './DialogService/DialogService';

export const socketService = new SocketService();
export const dialogService = new DialogService(dialogStore);
