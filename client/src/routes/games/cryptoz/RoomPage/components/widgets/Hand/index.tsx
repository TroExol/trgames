import type { PanInfo } from 'framer-motion';
import type { CryptozShared } from '@trgames/shared';

import { useMediaQuery } from 'usehooks-ts';
import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';

import { settingsStore } from '@/stores';
import { dialogStore, roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { cn } from '@/lib/utils';

export const Hand = observer(function Hand() {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [cardWidth, setCardWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSmHeight = useMediaQuery('(max-height: 640px)');
  const isMeActive = roomStore.me && roomStore.isActivePlayer(roomStore.me);
  const cards = roomStore.me?.hand ? [...roomStore.me.hand] : [];
  const showFullHandCards = settingsStore.cryptoz.showFullHandCards;
  const isInteractionLocked = dialogStore.isInteractionLocked;
  const canDragCards = isMeActive && !isInteractionLocked;

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);

        const cardElement = containerRef.current.querySelector<HTMLDivElement>('[data-hand-card]');
        if (cardElement?.clientWidth) {
          setCardWidth(cardElement.clientWidth);
        }
      }
    };
    const frameId = requestAnimationFrame(updateWidth);
    window.addEventListener('resize', updateWidth);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateWidth);
    };
  }, [cards.length, showFullHandCards, isSmHeight]);

  if (!roomStore.me?.hand) {
    return null;
  }

  const cardsWidth = cards.length * cardWidth;
  let overlap = 0;

  if (cards.length > 1 && cardWidth > 0) {
    overlap = Math.max((cardsWidth - containerWidth) / (cards.length - 1), 0);
  }
  const offset = Math.max((containerWidth - cardsWidth) / 2, 0);

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { point } = info;

    if (isInteractionLocked) {
      roomStore.setDraggedHandCard(null);
      return;
    }
    const draggedElement = event.target;

    if (!draggedElement) {
      return;
    }
    // point содержит глобальные координаты (с учетом scroll)
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const droppedElement = document.elementFromPoint(point.x - scrollX, point.y - scrollY);
    if (droppedElement?.id === 'play-card-zone' && roomStore.draggedHandCard) {
      socketService.playCard(roomStore.draggedHandCard);
    }
    roomStore.setDraggedHandCard(null);
  };

  const onDragStart = (card: CryptozShared.TCard) => {
    if (isInteractionLocked) {
      return;
    }
    roomStore.setDraggedHandCard(card);
  };

  const baseCardBottom = settingsStore.cryptoz.showFullHandCards ? 0 : -100;

  return (
    <>
      <div style={{ height: isSmHeight ? '80px' : '170px' }} />
      <div
        className="fixed bottom-0 left-1/2 z-20 flex w-3/4 -translate-x-1/2 items-center justify-center"
        ref={containerRef}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const left = offset + index * (cardWidth - overlap);
            return (
              <motion.div
                animate={{
                  bottom: baseCardBottom,
                  left: `${left}px`,
                  zIndex: 21 + index,
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                className="absolute bottom-0 cursor-grab"
                data-hand-card
                drag={canDragCards}
                dragSnapToOrigin
                exit={{
                  bottom: -100,
                  left: `${left}px`,
                  zIndex: -10,
                  opacity: 0,
                  x: 100,
                  scale: 0.8,
                }}
                initial={{
                  bottom: baseCardBottom,
                  left: `${left}px`,
                  zIndex: 21 + index,
                  opacity: 0,
                  x: 0,
                  scale: 0.8,
                }}
                key={card.uuid + roomStore.activePlayer?.nickname}
                onDragEnd={onDragEnd}
                onDragStart={() => onDragStart(card)}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3,
                }}
                whileHover={{
                  bottom: 0,
                  zIndex: 40,
                }}
                whileTap={{
                  zIndex: 40,
                }}
              >
                <Card
                  {...card}
                  className={cn({
                    'h-[180px]': isSmHeight,
                  })}
                  variant={roomStore.draggedHandCard === card ? 'lg' : 'md'}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
});
