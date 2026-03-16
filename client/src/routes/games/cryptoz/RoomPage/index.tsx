import type { CryptozShared as CryptozSharedType } from '@trgames/shared';

import { useDocumentTitle, useUnmount } from 'usehooks-ts';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { observer } from 'mobx-react-lite';
import { motion, useAnimationControls } from 'framer-motion';
import { CryptozShared, EGame } from '@trgames/shared';

import { analyticsService } from '@/services';
import {
  logsStore,
  messagesStore,
  roomStore,
} from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { Players } from '@/routes/games/cryptoz/RoomPage/components/widgets/Players';
import { Logs } from '@/routes/games/cryptoz/RoomPage/components/widgets/Logs';
import { Hand } from '@/routes/games/cryptoz/RoomPage/components/widgets/Hand';
import { Game } from '@/routes/games/cryptoz/RoomPage/components/widgets/Game';
import { Chat } from '@/routes/games/cryptoz/RoomPage/components/widgets/Chat';
import { PlayCardZone } from '@/routes/games/cryptoz/RoomPage/components/features/PlayCardZone';
import { DialogProvider } from '@/routes/games/cryptoz/RoomPage/components/features/DialogProvider';
import { cn } from '@/lib/utils';
import { useGameName } from '@/hooks/useGameName';

import { openCardsDialog, openStoneShardsDialog } from './services/DialogService/dialogHelpers';
import { DarknessCrown } from './components/features/DarknessCrown';
import { StoneShard } from './components/entites/StoneShard';
import { Card } from './components/entites/Card';

export const Component = observer(function CryptozRoomPage() {
  useDocumentTitle('Комната игры Криптоз');

  useEffect(() => {
    analyticsService.page(CryptozShared.EAnalyticsPage.ROOM);
  }, []);

  const location = useLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startedPathname = useMemo(() => location.pathname, []);
  const navigate = useNavigate();
  const { gameName } = useGameName();
  const shakeControls = useAnimationControls();
  const previousHealthRef = useRef<number | undefined>(roomStore.me?.health);
  const currentHealth = roomStore.me?.health;

  useEffect(() => {
    if (typeof currentHealth !== 'number') {
      previousHealthRef.current = currentHealth;
      return;
    }

    if (typeof previousHealthRef.current === 'number' && currentHealth < previousHealthRef.current) {
      void shakeControls.start({
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      });
    }

    previousHealthRef.current = currentHealth;
  }, [currentHealth, shakeControls]);

  useEffect(() => {
    if (startedPathname !== location.pathname) {
      return;
    }
    if (!socketService.socket?.connected) {
      navigate(`/game/${gameName}`);
      return;
    }
    socketService.socket.on('disconnect', () => {
      navigate(`/game/${gameName}`);
    });

    return () => {
      socketService.socket?.off('disconnect');
    };
  }, [gameName, location.pathname, navigate, startedPathname]);

  useUnmount(() => {
    analyticsService.track(CryptozShared.EAnalyticsEvent.ROOM_LEFT, {
      game: EGame.CRYPTOZ,
      roomId: roomStore.room.uuid,
    });
    socketService.close();
    roomStore.clear();
    logsStore.clear();
    messagesStore.clear();
  });

  const showCards = (title: string, cards: CryptozSharedType.TCard[]) => {
    openCardsDialog({
      title,
      cards,
      canCollapse: false,
    });
  };

  const showStoneShards = (stoneShards: CryptozSharedType.TStoneShard[]) => {
    openStoneShardsDialog({
      title: 'Осколки Философского камня',
      stoneShards,
      canCollapse: false,
    });
  };

  return !!roomStore.room.playerNickname && (
    <>
      <motion.div animate={shakeControls} className="flex w-full justify-between" initial={{ x: 0 }}>
        <div className="relative flex w-full flex-col gap-4">
          <Players />
          <Game />
          <Hand />
          <PlayCardZone />
        </div>
        <div className="flex h-full flex-col gap-1 sm:justify-center">
          <div className="flex flex-col items-center gap-1">
            {!!roomStore.room.countDeck && (
              <div
                className={cn('relative')}
                title="Основная стопка"
              >
                <Card isShowShirt variant="sm" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">
                  {roomStore.room.countDeck}
                </span>
              </div>
            )}
            {!!roomStore.room.cursedSeal.length && (
              <div
                className="relative cursor-pointer"
                onClick={() => showCards('', roomStore.room.cursedSeal.slice(-1))}
                tabIndex={0}
                title={roomStore.room.cursedSeal[0].name}
              >
                <Card {...roomStore.room.cursedSeal[0]} variant="sm" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">
                  {roomStore.room.cursedSeal.length}
                </span>
              </div>
            )}
            {!!roomStore.room.removed.cards.length && (
              <div
                className="relative cursor-pointer"
                onClick={() => showCards('Удаленные карты', roomStore.room.removed.cards)}
                tabIndex={0}
                title={roomStore.room.removed.cards[0].name}
              >
                <Card {...roomStore.room.removed.cards[0]} variant="sm" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">
                  {roomStore.room.removed.cards.length}
                </span>
              </div>
            )}
            {!!roomStore.room.removed.chaos.length && (
              <div
                className="relative cursor-pointer"
                onClick={() => showCards('Удаленные хаосы', roomStore.room.removed.chaos)}
                tabIndex={0}
                title={roomStore.room.removed.chaos[0].name}
              >
                <Card {...roomStore.room.removed.chaos[0]} variant="sm" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">
                  {roomStore.room.removed.chaos.length}
                </span>
              </div>
            )}
            {!!roomStore.room.stoneShards.length && (
              <div
                className="relative cursor-pointer"
                onClick={() => showStoneShards(roomStore.room.stoneShards)}
                tabIndex={0}
                title="Осколки Философского камня"
              >
                <StoneShard isShowShirt variant="sm" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">
                  {roomStore.room.stoneShards.length}
                </span>
              </div>
            )}
            <div className="[&_svg]:size-8">
              {!roomStore.room.players.some(player => player.hasDarknessCrown) && <DarknessCrown />}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Logs />
            <Chat />
          </div>
        </div>
      </motion.div>
      <DialogProvider />
    </>
  );
});
