import type { CryptozShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';
import {
  HandMetal,
  Heart,
  Star,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import {
  openAbilitiesDialog,
  openCardsDialog,
  openPlayAbilityDialog,
  openStoneShardsDialog,
} from '@/routes/games/cryptoz/RoomPage/services/DialogService/dialogHelpers';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { StoneShard } from '@/routes/games/cryptoz/RoomPage/components/entites/StoneShard';
import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { Ability } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability';
import { cn } from '@/lib/utils';
import { useHeartBeatAnimation } from '@/hooks/useHeartBeatAnimation';
import { Typography } from '@/components/ui/Typography';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Button, buttonVariants } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';

import { DarknessCrown } from '../../features/DarknessCrown';

export const Player = observer(function Player({
  nickname,
  health,
  gloryShards,
  isOnline,
  hasNoctullos,
  hasDarknessCrown,
  abilities,
  countDeck,
  countHand,
  hand,
  discard,
  stoneShards,
  companion,
  seals,
  isReady,
}: CryptozShared.TPlayer) {
  const isMeAndAdmin = roomStore.me && roomStore.isAdminPlayer(roomStore.me);
  const isMe = roomStore.isMe(nickname);
  const isActive = roomStore.isActivePlayer(nickname);
  const hpControls = useHeartBeatAnimation(health);
  const gloryShardsControls = useHeartBeatAnimation(gloryShards);

  const onRemovePlayer = () => {
    socketService.removePlayer(nickname);
  };

  const showDiscard = () => {
    if (!discard.length) {
      return;
    }

    openCardsDialog({
      title: `Сброс участника ${nickname}`,
      cards: discard,
      canClose: true,
      canCollapse: false,
    });
  };

  const showHand = () => {
    if (!hand?.length) {
      return;
    }

    openCardsDialog({
      title: `Рука участника ${nickname}`,
      cards: hand,
      canClose: true,
      canCollapse: false,
    });
  };

  const showSeals = () => {
    if (!seals?.length) {
      return;
    }

    openCardsDialog({
      title: `Печати участника ${nickname}`,
      cards: seals,
      canClose: true,
      canCollapse: false,
    });
  };

  const showCompanion = () => {
    if (!companion) {
      return;
    }

    openCardsDialog({
      title: `Помощник участника ${nickname}`,
      cards: [companion],
      canClose: true,
      canCollapse: false,
    });
  };

  const showAbilities = () => {
    if (!abilities.length) {
      return;
    }

    if (isMe && isActive) {
      openPlayAbilityDialog({
        title: `Разыграть способность`,
        onSubmit: ability => {
          socketService.playAbility(ability);
        },
        canClose: true,
        canCollapse: false,
      });
      return;
    }

    openAbilitiesDialog({
      title: `Способности участника ${nickname}`,
      abilities,
      canClose: true,
      canCollapse: false,
    });
  };

  const showStoneShards = () => {
    openStoneShardsDialog({
      title: `Осколки Философского камня участника ${nickname}`,
      stoneShards,
      canClose: true,
      canCollapse: false,
    });
  };

  return (
    <div className="flex w-[150px] flex-col items-center justify-center p-2">
      <div className="flex items-center gap-1">
        <Typography className="text-md break-all" variant="p">{nickname}</Typography>
        {isMeAndAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="size-7 [&_svg]:size-6" size="icon" variant="ghost">
                <XCircle />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Вы уверены, что хотите удалить участника
                  {' '}
                  {nickname}
                  ?
                </AlertDialogTitle>
                <AlertDialogDescription />
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отменить</AlertDialogCancel>
                <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={onRemovePlayer}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex select-none items-center gap-1 text-lg">
          <motion.span animate={hpControls} className="relative shadow-stroke">
            <Heart className="inline-block size-[30px] text-red-600/60" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {health}
            </span>
          </motion.span>
          {gloryShards !== undefined && (
            <motion.span animate={gloryShardsControls} className="relative shadow-stroke">
              <Star className="inline-block size-[30px] text-yellow-500/60" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {gloryShards}
              </span>
            </motion.span>
          )}
        </div>

        <div className="flex justify-center gap-1">
          {hasDarknessCrown && (
            <DarknessCrown />
          )}
          {hasNoctullos && (
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <HandMetal />
              </TooltipTrigger>
              <TooltipContent>
                Владеет картой &#34;Ноктуллос&#34;
              </TooltipContent>
            </Tooltip>
          )}
          {!isOnline && (
            <WifiOff className="justify-center" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {!!seals.length && (
            <div
              className={cn('relative w-fit select-none', {
                'cursor-pointer': seals.length,
              })}
              onClick={showSeals}
              title="Печати"
            >
              <Card {...seals[0]} variant="sm" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{seals.length}</span>
            </div>
          )}
          {!!companion && (
            <Card {...companion} className="cursor-pointer" onClick={showCompanion} variant="sm" />
          )}
          {!!abilities.length && (
            <div
              className={cn('relative w-fit select-none', {
                'cursor-pointer': abilities.length,
              })}
              onClick={showAbilities}
              title="Способности"
            >
              <Ability isShowShirt variant="sm" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{abilities.length}</span>
            </div>
          )}
          {!!stoneShards.length && (
            <div
              className={cn('relative w-fit select-none', {
                'cursor-pointer': stoneShards.length,
              })}
              onClick={showStoneShards}
              title="Осколки Философского камня"
            >
              <StoneShard isShowShirt variant="sm" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{stoneShards.length}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-1">
          <div
            className={cn('relative w-fit select-none', {
              'cursor-pointer': discard.length,
            })}
            onClick={showDiscard}
            title="Сброс"
          >
            {discard.length
              ? <Card {...discard[0]} variant="sm" />
              : <Card isShowShirt variant="sm" />}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{discard.length}</span>
          </div>
          <div className="relative w-fit select-none" title="Личная стопка">
            <Card isShowShirt variant="sm" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{countDeck}</span>
          </div>
          <div
            className={cn('relative w-fit select-none', {
              'cursor-pointer': hand?.length,
            })}
            onClick={showHand}
            title="Рука"
          >
            {hand?.length
              ? <Card {...hand[0]} variant="sm" />
              : <Card isShowShirt variant="sm" />}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-stroke">{countHand}</span>
          </div>
        </div>

        {!roomStore.room.isGameStarted && (
          <Button
            className={cn('h-auto py-1', {
              'bg-accent': isReady,
            })}
            disabled={!isMe}
            onClick={() => socketService.toggleReady()}
            size="sm"
          >
            {isReady ? 'Готов' : 'Не готов'}
          </Button>
        )}
      </div>
    </div>
  );
});
