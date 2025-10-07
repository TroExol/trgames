import type { CryptozShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';
import { Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';

export const Market = observer(function Market() {
  const market = roomStore.room.market || [];
  const essenceToSpend = roomStore.activePlayer?.essenceToSpend || 0;

  const getCardHighlight = (price?: number) => (
    price !== undefined && price <= essenceToSpend
      ? 'ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-emerald-400/10 shadow-[0_0_22px_rgba(16,185,129,0.45)]'
      : ''
  );

  const buyMarketCard = (card: CryptozShared.TCard) => {
    socketService.buyMarketCard(card);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-2 flex items-center gap-2">
        <Typography className="text-center" variant="h3">
          Покупка карт
        </Typography>
        <Badge className="text-md flex items-center gap-1" variant="secondary">
          <Zap className="size-4" />
          {roomStore.activePlayer?.essenceToSpend || 0}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <AnimatePresence mode="wait">
            {roomStore.activePlayer?.companion && (
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="hover:z-10"
                exit={{ y: -100, opacity: 0 }}
                initial={{ y: 100, opacity: 0 }}
                key={roomStore.activePlayer.companion.uuid}
              >
                <Card
                  {...roomStore.activePlayer.companion}
                  className={cn(
                    'transition-all duration-200 hover:scale-150',
                    getCardHighlight(roomStore.activePlayer.companion.price),
                  )}
                  isDisabled={roomStore.activePlayer.companion.price > (roomStore.activePlayer?.essenceToSpend || 0)}
                  onClick={() => socketService.buyCompanion()}
                  variant="md"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <AnimatePresence mode="wait">
              {roomStore.room.harbinger && (
                <motion.div
                  animate={{ y: 0, opacity: 1 }}
                  className="hover:z-10"
                  exit={{ y: -100, opacity: 0 }}
                  initial={{ y: 100, opacity: 0 }}
                  key={roomStore.room.harbinger.uuid}
                >
                  <div
                    className={cn(
                      'relative transition-all duration-200 hover:scale-150',
                      getCardHighlight(roomStore.room.harbinger.price),
                    )}
                  >
                    <Card
                      {...roomStore.room.harbinger}
                      isDisabled={roomStore.room.harbinger.price > (roomStore.activePlayer?.essenceToSpend || 0)}
                      onClick={() => socketService.buyHarbinger()}
                      variant="md"
                    />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2">
                      {roomStore.room.countHarbingers}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {!!roomStore.room.darknessMadness.length && (
                <motion.div
                  animate={{ y: 0, opacity: 1 }}
                  className="relative hover:z-10"
                  exit={{ y: -100, opacity: 0 }}
                  initial={{ y: 100, opacity: 0 }}
                  key={roomStore.room.darknessMadness[0].uuid}
                >
                  <div
                    className={cn(
                      'relative transition-all duration-200 hover:scale-150',
                      getCardHighlight(roomStore.room.darknessMadness[0].price),
                    )}
                  >
                    <Card
                      {...roomStore.room.darknessMadness[0]}
                      isDisabled={
                        roomStore.room.darknessMadness[0].price > (roomStore.activePlayer?.essenceToSpend || 0)
                      }
                      onClick={() => socketService.buyDarknessMadness()}
                      variant="md"
                    />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2">
                      {roomStore.room.darknessMadness.length}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <AnimatePresence>
            {market.map(card => (
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="shrink-0 hover:z-10"
                exit={{ y: -100, opacity: 0 }}
                initial={{ y: 100, opacity: 0 }}
                key={card.uuid}
              >
                <Card
                  {...card}
                  className={cn(
                    'transition-all duration-200 hover:scale-150',
                    getCardHighlight(card.price),
                  )}
                  isDisabled={card.price > (roomStore.activePlayer?.essenceToSpend || 0)}
                  onClick={() => buyMarketCard(card)}
                  variant="md"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
