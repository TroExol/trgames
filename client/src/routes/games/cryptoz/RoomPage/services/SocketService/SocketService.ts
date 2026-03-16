import type { Socket } from 'socket.io-client';

import { toast } from 'sonner';
import { io } from 'socket.io-client';
import {
  CryptozShared,
  EAnalyticsEvent,
  EGame,
} from '@trgames/shared';

import type { TSocketServiceConnectParams } from '@/routes/games/cryptoz/RoomPage/services/SocketService/types';

import { analyticsService } from '@/services';
import {
  logsStore,
  messagesStore,
  roomStore,
} from '@/routes/games/cryptoz/RoomPage/stores';
import { getApiUrl } from '@/lib/constants';

import {
  openCardsDialog,
  openEndGameDialog,
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
        if (this.socket?.recovered) {
          analyticsService.track(EAnalyticsEvent.WEBSOCKET_RECONNECTED, {
            game: EGame.CRYPTOZ,
          });
        }
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
        analyticsService.track(EAnalyticsEvent.WEBSOCKET_DISCONNECTED, {
          game: EGame.CRYPTOZ,
          reason,
        });
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
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          cardsCount: cards.length,
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.cards,
          title,
        });
        openCardsDialog({
          cards,
          title: title || '',
          cardsSubtitle,
          canCollapse,
          canClose,
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalEndGame, ({
        players,
      }: CryptozShared.TModalParams<CryptozShared.EModalTypes.endGame>) => {
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.endGame,
        });
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
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.selectStartCards,
        });
        openSelectStartCardsDialog({
          companions,
          abilities,
          onSubmit: (companion: CryptozShared.TCard, ability: CryptozShared.TAbility) => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: false,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectStartCards,
              selectedCardIds: [companion.id],
            });
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
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          cardsCount: cards.length,
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.selectCards,
          title,
          variants: variants?.map(v => v.value),
        });
        openCardsDialog({
          cards,
          title: title || '',
          cardsSubtitle,
          countCardsToSelect: count,
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: true,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectCards,
            });
            callback({ closed: true });
          },
          onSubmit: (id: string | number, selectedCards: CryptozShared.TCard[]) => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: false,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectCards,
              selectedCardIds: selectedCards.map(c => c.id),
              selectedVariantId: id,
            });
            callback({ variant: id, selectedCards });
          },
        });
      });

      this.socket.on(CryptozShared.EEventTypes.showModalSelectStoneShards, (
        {
          stoneShards,
          title,
          variants,
          count,
          canClose,
          canCollapse,
        }: CryptozShared.TModalParams<CryptozShared.EModalTypes.selectStoneShards>,
        callback: (params: CryptozShared.TModalResponse<CryptozShared.EModalTypes.selectStoneShards>) => void,
      ) => {
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.selectStoneShards,
          title,
        });
        openStoneShardsDialog({
          stoneShards,
          title: title || '',
          countStoneShardsToSelect: count,
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: true,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectStoneShards,
            });
            callback({ closed: true });
          },
          onSubmit: (id: string | number, selectedStoneShards: CryptozShared.TStoneShard[]) => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: false,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectStoneShards,
              selectedShardIds: selectedStoneShards.map(s => s.id),
              selectedVariantId: id,
            });
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
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.selectVariant,
          title,
          variants: variants.map(v => v.value),
        });
        openSelectVariantDialog({
          title: title || '',
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: true,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectVariant,
            });
            callback({ closed: true });
          },
          onSubmit: (id: string | number) => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: false,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.selectVariant,
              selectedVariantId: id,
            });
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
        analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_SHOWN, {
          cardAttackId: cardAttack?.id,
          game: EGame.CRYPTOZ,
          modalType: CryptozShared.EModalTypes.suggestEvade,
          title,
        });
        openSuggestEvadeDialog({
          title: title || '',
          cards,
          cardsToShow,
          cardAttack,
          variants,
          canCollapse,
          canClose,
          onClose: () => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: true,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.suggestEvade,
            });
            callback({ closed: true });
          },
          onSubmit: (id: number, selectedCard: CryptozShared.TCard) => {
            analyticsService.track(CryptozShared.EAnalyticsEvent.MODAL_RESPONDED, {
              closed: false,
              game: EGame.CRYPTOZ,
              modalType: CryptozShared.EModalTypes.suggestEvade,
              selectedCardIds: [selectedCard.id],
              selectedVariantId: id,
            });
            callback({ variant: id, selectedCard });
          },
        });
      });
    });
  };

  public sendMessage = (message: string) => {
    this.socket?.emit(CryptozShared.EEventTypes.sendMessage, message);
    analyticsService.track(CryptozShared.EAnalyticsEvent.MESSAGE_SENT, {
      game: EGame.CRYPTOZ,
    });
  };

  public playCard = (card: CryptozShared.TCard) => {
    this.socket?.emit(CryptozShared.EEventTypes.playCard, { card });
    analyticsService.track(CryptozShared.EAnalyticsEvent.CARD_PLAYED, {
      cardId: card.id,
      game: EGame.CRYPTOZ,
    });
  };

  public playAbility = (ability: CryptozShared.TAbility) => {
    this.socket?.emit(CryptozShared.EEventTypes.playAbility, ability);
    analyticsService.track(CryptozShared.EAnalyticsEvent.ABILITY_PLAYED, {
      abilityId: ability.id,
      game: EGame.CRYPTOZ,
    });
  };

  public toggleReady = () => {
    this.socket?.emit(CryptozShared.EEventTypes.toggleReady);
    analyticsService.track(CryptozShared.EAnalyticsEvent.PLAYER_READY_TOGGLED, {
      game: EGame.CRYPTOZ,
    });
  };

  public removePlayer = (nickname: string) => {
    this.socket?.emit(CryptozShared.EEventTypes.removePlayer, nickname);
    analyticsService.track(CryptozShared.EAnalyticsEvent.PLAYER_REMOVED, {
      game: EGame.CRYPTOZ,
      roomId: roomStore.room.uuid,
    });
  };

  public buyMarketCard = (card: CryptozShared.TCard) => {
    this.socket?.emit(CryptozShared.EEventTypes.buyMarketCard, card);
    analyticsService.track(CryptozShared.EAnalyticsEvent.CARD_BOUGHT, {
      cardId: card.id,
      cardType: card.type,
      game: EGame.CRYPTOZ,
    });
  };

  public buyCompanion = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyCompanionCard);
    analyticsService.track(CryptozShared.EAnalyticsEvent.CARD_BOUGHT, {
      cardType: CryptozShared.ECardType.COMPANION,
      game: EGame.CRYPTOZ,
    });
  };

  public buyHarbinger = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyHarbingerCard);
    analyticsService.track(CryptozShared.EAnalyticsEvent.CARD_BOUGHT, {
      cardType: CryptozShared.ECardType.HARBINGER,
      game: EGame.CRYPTOZ,
    });
  };

  public buyDarknessMadness = () => {
    this.socket?.emit(CryptozShared.EEventTypes.buyDarknessMadnessCard);
    analyticsService.track(CryptozShared.EAnalyticsEvent.CARD_BOUGHT, {
      cardType: CryptozShared.ECardType.DARKNESS_MADNESS,
      game: EGame.CRYPTOZ,
    });
  };

  public endTurn = () => {
    this.socket?.emit(CryptozShared.EEventTypes.endTurn);
    analyticsService.track(CryptozShared.EAnalyticsEvent.TURN_ENDED, {
      game: EGame.CRYPTOZ,
      roomId: roomStore.room.uuid,
    });
  };

  public close = (): void => {
    this.socket?.close();
  };
}
