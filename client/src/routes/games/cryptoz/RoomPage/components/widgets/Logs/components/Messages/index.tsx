import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { logsStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { Typography } from '@/components/ui/Typography';
import { ScrollArea } from '@/components/ui/ScrollArea';

export const Messages = observer(function Messages() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const $container = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!$container) {
      return;
    }
    $container.scrollTo(0, $container.scrollHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsStore.logs]);

  return (
    <ScrollArea className="h-full flex-1 break-word" ref={containerRef}>
      {logsStore.logs.map(log => (
        <div
          className="mb-1 last:mb-0"
          key={log.uuid}
        >
          <Typography variant="p">
            {new Date(log.date).toLocaleString()}
          </Typography>
          <Typography className="text-muted-foreground" variant="p">
            {log.message}
          </Typography>
        </div>
      ))}
    </ScrollArea>
  );
});
