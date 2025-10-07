import type React from 'react';

import { useBoolean } from 'usehooks-ts';
import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { MessageSquare } from 'lucide-react';
import last from 'lodash/last';
import { motion } from 'framer-motion';

import { messagesStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';
import { useHeartBeatAnimation } from '@/hooks/useHeartBeatAnimation';
import { Input } from '@/components/ui/Input';
import { DrawerPopover } from '@/components/ui/DrawerPopover';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { Messages } from './components/Messages';

export const Chat = observer(function Chat() {
  const { value: isOpen, setValue: setIsOpen } = useBoolean(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const countUnreadMessagesControls = useHeartBeatAnimation(messagesStore.unreadMessages.length);

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    const readMessage = last(messagesStore.messages);
    if (readMessage) {
      messagesStore.setLastReadMessage(readMessage);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputRef.current?.value) {
      socketService.sendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      const readMessage = last(messagesStore.messages);
      if (readMessage) {
        messagesStore.setLastReadMessage(readMessage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesStore.messages, isOpen]);

  return (
    <DrawerPopover
      content={(
        <div className="flex h-full flex-col gap-2 overflow-hidden p-4 sm:p-0">
          <Messages />
          <Input className="border-border" onKeyDown={onKeyDown} placeholder="Напиши сообщение..." ref={inputRef} />
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
        {!!messagesStore.unreadMessages.length && (
          <Badge className="absolute -right-1 -top-1 rounded-full" variant="secondary">
            <motion.span animate={countUnreadMessagesControls}>
              {messagesStore.unreadMessages.length}
            </motion.span>
          </Badge>
        )}
        <MessageSquare />
      </Button>
    </DrawerPopover>
  );
});
