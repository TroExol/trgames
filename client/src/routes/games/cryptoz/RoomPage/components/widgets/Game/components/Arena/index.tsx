import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

export const Arena = observer(function Arena() {
  const arenaCards = roomStore.activePlayer?.arena || [];
  const isMeActive = !!roomStore.activePlayer && roomStore.isMe(roomStore.activePlayer);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-2">
        <Typography className="text-center" variant="h3">
          Арена
        </Typography>
        {isMeActive && roomStore.room.isGameStarted && !roomStore.room.isGameEnded && (
          <Button
            className="mt-2"
            disabled={!!roomStore.room.pendingAckNicknames.length}
            onClick={() => socketService.endTurn()}
            title={roomStore.room.pendingAckNicknames.length ? 'Ожидаем ответа от участников' : undefined}
            variant="secondary"
          >
            Закончить ход
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <AnimatePresence>
          {arenaCards.map((card, index) => (
            <motion.div
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              className="shrink-0"
              exit={{
                opacity: 0,
                scale: 0.8,
                y: -20,
              }}
              initial={{
                opacity: 0,
                scale: 0.8,
                y: 20,
              }}
              key={card.uuid}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.1,
              }}
            >
              <Card
                {...card}
                variant="md"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
