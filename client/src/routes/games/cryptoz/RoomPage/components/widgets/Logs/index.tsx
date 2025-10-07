import { useBoolean } from 'usehooks-ts';
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollText } from 'lucide-react';
import last from 'lodash/last';
import { motion } from 'framer-motion';

import { logsStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { useHeartBeatAnimation } from '@/hooks/useHeartBeatAnimation';
import { DrawerPopover } from '@/components/ui/DrawerPopover';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { Messages } from './components/Messages';

export const Logs = observer(function Logs() {
  const { value: isOpen, setValue: setIsOpen } = useBoolean(false);
  const countUnreadLogsControls = useHeartBeatAnimation(logsStore.unreadLogs.length);

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    const readLog = last(logsStore.logs);
    if (readLog) {
      logsStore.setLastReadLog(readLog);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const readLog = last(logsStore.logs);
      if (readLog) {
        logsStore.setLastReadLog(readLog);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsStore.logs, isOpen]);

  return (
    <DrawerPopover
      content={(
        <div className="h-full overflow-hidden p-4 sm:p-0">
          <Messages />
        </div>
      )}
      drawerContentProps={{ className: 'h-4/5' }}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      popoverContentProps={{ align: 'end', side: 'left', className: 'h-[400px] [@media(max-height:400px)]:h-dvh' }}
      setIsOpen={setIsOpen}
      title={<div className="hidden">Чат</div>}
    >
      <Button className="relative [&_svg]:size-8" size="icon" variant="ghost">
        {!!logsStore.unreadLogs.length && (
          <Badge className="absolute -right-1 -top-1 rounded-full" variant="secondary">
            <motion.span animate={countUnreadLogsControls}>
              {logsStore.unreadLogs.length}
            </motion.span>
          </Badge>
        )}
        <ScrollText />
      </Button>
    </DrawerPopover>
  );
});
