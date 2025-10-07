import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { messagesStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { cn } from '@/lib/utils';
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
  }, [messagesStore.messages]);

  return (
    <ScrollArea className="h-full flex-1 break-word" ref={containerRef}>
      {messagesStore.messages.map(message => (
        <div
          className={cn(
            'mb-1 last:mb-0',
            {
              'text-muted-foreground/40': message.senderParticipant === 'viewer',
            },
          )}
          key={message.uuid}
        >
          <Typography variant="p">
            {message.senderNickname}
            {': '}
            <span className="text-primary-foreground">
              {message.message}
            </span>
          </Typography>
        </div>
      ))}
    </ScrollArea>
  );
});
