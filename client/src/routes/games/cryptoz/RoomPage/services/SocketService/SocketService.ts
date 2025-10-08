import type { Socket } from 'socket.io-client';

import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { CryptozShared } from '@trgames/shared';

import type { TSocketServiceConnectParams } from '@/routes/games/cryptoz/RoomPage/services/SocketService/types';

import {
  logsStore,
  messagesStore,
  roomStore,
} from '@/routes/games/cryptoz/RoomPage/stores';
import { getApiUrl } from '@/lib/constants';

import {
  openCardsDialog,
  openEndGameDialog,
  openEntitiesDialog,
  openSelectStartCardsDialog,
  openSelectVariantDialog,
  openStoneShardsDialog,
  openSuggestEvadeDialog,
} from '../DialogService/dialogHelpers';

export class SocketService {
  public socket: Socket<
    CryptozShared.TServerToClientEvents,
    CryptozShared.TClientToServerEvents
  > | undefined;

  public connect = async ({
    roomUuid,
    nickname,
    roomPassword,
    participant,
  }: TSocketServiceConnectParams): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.socket = io(
        getApiUrl(`/room/${roomUuid}`),
        { query: { nickname, participant, roomPassword: roomPassword }, multiplex: false },
      );

      this.socket.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Подключение установлено');
        }
        resolve(undefined);
      });

      this.socket.on('connect_error', error => {
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Ошибка соединения с сервером');
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Ошибка соединения с сервером', error);
        }
        reject(error);
      });

      this.socket.on('disconnect', (reason, details) => {
        if (!this.socket?.active && process.env.NODE_ENV === 'development') {
          console.log('Соединение разорвано', reason, details);
        }
      });

      this.socket.on(CryptozShared.EEventTypes.showToast, ({ message }) => {
        toast(message);
      });

      this.socket.on(CryptozShared.EEventTypes.sendMessages, messages => {
        messagesStore.updateMessages(messages);
      });

      this.socket.on(CryptozShared.EEventTypes.sendLogs, logs => {
        logsStore.updateLogs(logs);
      });

      this.socket.on(CryptozShared.EEventTypes.updateRoom, room => {
        roomStore.updateRoom(room);
      });

      this.socket.on(CryptozShared.EEventTypes.showModalCards, ({
        cards,
        title,
        cardsSubtitle,
        canClose,
        canCollapse,
      }: CryptozShared.TModalParams<CryptozShared.EModalTypes.cards>) => {
        openCardsDialog({
          cards,
          title: title || '',
          cardsSubtitle,
          canCollapse,
          canClose,
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalEntities, ({
        title,
        cards,
        cardsSubtitle,
        abilities,
        stoneShards,
        canClose,
        canCollapse,
      }: CryptozShared.TModalParams<CryptozShared.EModalTypes.entities>) => {
        openEntitiesDialog({
          title: title || '',
          cards,
          cardsSubtitle,
          abilities,
          stoneShards,
          canClose,
          canCollapse,
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalEndGame, ({
        players,
      }: CryptozShared.TModalParams<CryptozShared.EModalTypes.endGame>) => {
        openEndGameDialog({
          players,
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSelectStartCards, (
        {
          companions,
          abilities,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.selectStartCards>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.selectStartCards>
        ) => void) => {
        openSelectStartCardsDialog({
          companions,
          abilities,
          onSubmit: (companion: CryptozShared.TCard, ability: CryptozShared.TAbility) => {
            callback({ companion, ability });
          },
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSelectCards, (
        {
          cards,
          title,
          variants,
          count,
          cardsSubtitle,
          canClose,
          canCollapse,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.selectCards>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.selectCards>) => void,
      ) => {
        openCardsDialog({
          cards,
          title: title || '',
          cardsSubtitle,
          countCardsToSelect: count,
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            callback({ closed: true });
          },
          onSubmit: (id: string | number, selectedCards: CryptozShared.TCard[]) => {
            callback({ variant: id, selectedCards });
          },
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSelectStoneShards, (
        {
          stoneShards,
          title,
          variants,
          canClose,
          canCollapse,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.selectStoneShards>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.selectStoneShards>) => void,
      ) => {
        openStoneShardsDialog({
          stoneShards,
          title: title || '',
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            callback({ closed: true });
          },
          onSubmit: (id: string | number, selectedStoneShards: CryptozShared.TStoneShard[]) => {
            callback({ variant: id, selectedStoneShards });
          },
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSelectVariant, (
        {
          title,
          variants,
          canClose,
          canCollapse,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.selectVariant>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.selectVariant>) => void,
      ) => {
        openSelectVariantDialog({
          title: title || '',
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            callback({ closed: true });
          },
          onSubmit: (id: string | number) => {
            callback({ variant: id });
          },
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSuggestEvade, (
        {
          title,
          cards,
          variants,
          cardsToShow,
          cardAttack,
          canClose,
          canCollapse,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.suggestEvade>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.suggestEvade>) => void,
      ) => {
        openSuggestEvadeDialog({
          title: title || '',
          cards,
          cardsToShow,
          cardAttack,
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            callback({ closed: true });
          },
          onSubmit: (id: number, selectedCard: CryptozShared.TCard) => {
            callback({ variant: id, selectedCard });
          },
        });
      });
    });
  };

  public sendMessage = (message: string) => {
    this.socket?.emit(CryptozShared.EEventTypes.sendMessage, message);
  };

  public playCard = (card: CryptozShared.TCard) => {
    this.socket?.emit(CryptozShared.EEventTypes.playCard, { card });
  };

  public playAbility = (ability: CryptozShared.TAbility) => {
    this.socket?.emit(CryptozShared.EEventTypes.playAbility, ability);
  };

  public toggleReady = () => {
    this.socket?.emit(CryptozShared.EEventTypes.toggleReady);
  };

  public removePlayer = (nickname: string) => {
    this.socket?.emit(CryptozShared.EEventTypes.removePlayer, nickname);
  };

  public buyMarketCard = (card: CryptozShared.TCard) => {
    this.socket?.emit(CryptozShared.EEventTypes.buyMarketCard, card);
  };

  public buyCompanion = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyCompanionCard);
  };

  public buyHarbinger = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyHarbingerCard);
  };

  public buyDarknessMadness = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyDarknessMadnessCard);
  };

  public endTurn = () => {
    this.socket?.emit(CryptozShared.EEventTypes.endTurn);
  };

  public close = (): void => {
    this.socket?.close();
  };
}
