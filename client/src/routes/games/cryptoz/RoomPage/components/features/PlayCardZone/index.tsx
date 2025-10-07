import { observer } from 'mobx-react-lite';
import { Play } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';

export const PlayCardZone = observer(function PlayCardZone() {
  const canPlay = !!roomStore.me && roomStore.isActivePlayer(roomStore.me) && roomStore.draggedHandCard;

  return (
    <AnimatePresence>
      {canPlay && (
        <motion.div
          animate={{
            opacity: 0.9,
            scale: 1,
          }}
          className="fixed left-1/2 top-1/2 z-50 flex aspect-[2/3] h-[270px] items-center justify-center"
          exit={{
            opacity: 0,
            scale: 0.8,
          }}
          id="play-card-zone"
          initial={{
            opacity: 0.9,
            scale: 0.8,
            y: '-50%',
            x: '-50%',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration: 0.3,
          }}
        >
          {/* Основной контейнер с градиентом */}
          <div className="pointer-events-none relative flex size-full items-center justify-center rounded-2xl border-2 border-dashed border-purple-400/60 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/50 shadow-2xl backdrop-blur-md">

            {/* Анимированные частицы */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              className="pointer-events-none absolute inset-0 rounded-2xl"
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <div className="absolute -left-1 -top-1 size-2 rounded-full bg-purple-400/60 blur-sm" />
              <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-blue-400/60 blur-sm" />
              <div className="absolute -top-2 right-4 size-1 rounded-full bg-pink-400/60 blur-sm" />
              <div className="absolute -left-2 bottom-4 size-1.5 rounded-full bg-cyan-400/60 blur-sm" />
            </motion.div>

            {/* Внутренний контейнер с эффектом свечения */}
            <div className="relative flex size-[85%] items-center justify-center rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-800/20 via-purple-700/10 to-purple-800/30">

              {/* Центральная иконка и текст */}
              <motion.div
                animate={{
                  scale: 1,
                  rotate: 0,
                }}
                className="flex flex-col items-center gap-3 text-purple-200"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                }}
              >
                {/* Иконка с эффектом свечения */}
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: 1,
                    }}
                    className="absolute inset-0 rounded-full bg-purple-400/30 blur-md"
                  />
                  <Play className="relative stroke-purple-300" size={48} />
                </div>

                {/* Текст с градиентом */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-sm font-semibold text-transparent">
                    Разыграть карту
                  </div>
                  <div className="mt-1 text-xs text-purple-300/70">
                    Перетащите сюда
                  </div>
                </div>
              </motion.div>

              {/* Анимированные границы */}
              <motion.div
                animate={{
                  opacity: 0.3,
                }}
                className="absolute inset-0 rounded-xl border border-purple-400/40"
              />
            </div>

            {/* Внешние декоративные элементы */}
            <motion.div
              animate={{
                rotate: -360,
              }}
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-400/20 via-transparent to-blue-400/20"
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
