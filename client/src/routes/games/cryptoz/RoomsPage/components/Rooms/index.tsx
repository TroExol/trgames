import { observer } from 'mobx-react-lite';
import {
  Lock,
  Play,
  X,
} from 'lucide-react';

import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { ButtonCreateRoom } from '@/routes/games/cryptoz/RoomsPage/components/Rooms/components/ButtonCreateRoom';
import { RoomFooter } from '@/routes/games/cryptoz/RoomsPage/components/RoomInfo/components/RoomFooter';
import { RoomDescription } from '@/routes/games/cryptoz/RoomsPage/components/RoomInfo/components/RoomDescription';
import { useDeviceWidth } from '@/hooks/useDeviceWidth';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';

export const RoomList = observer(function RoomList() {
  const { isSm } = useDeviceWidth();

  return (
    <div className="flex h-[max(calc(100vh-300px),300px)] grow flex-col overflow-hidden rounded-md border border-border shadow-md shadow-accent">
      {!!roomsStore.filteredRooms.length && (
        <ScrollArea className="mt-2 px-2 sm:mt-4 sm:px-4">
          <div className="flex flex-col gap-2">
            {roomsStore.filteredRooms.map(room => (
              <Drawer key={room.uuid} open={isSm ? false : undefined}>
                <DrawerTrigger asChild>
                  <Button
                    className="w-full"
                    onClick={() => roomsStore.setSelectedRoom(room.uuid)}
                    variant="ghost"
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="mr-1 truncate" title={room.name}>{room.name}</span>
                      <span className="flex gap-1 text-card-foreground">
                        {room.isGameStarted && !room.isGameEnded && <Play />}
                        {room.isGameEnded && <X />}
                        {room.isWithPassword && <Lock />}
                      </span>
                    </span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="line-clamp-3 break-all text-xl">{room.name}</DrawerTitle>
                    <DrawerDescription className="flex grow flex-col gap-4 p-4 pb-0">
                      <RoomDescription />
                    </DrawerDescription>
                  </DrawerHeader>
                  {!room.isGameEnded && (
                    <DrawerFooter>
                      <RoomFooter />
                    </DrawerFooter>
                  )}
                </DrawerContent>
              </Drawer>
            ))}
          </div>
        </ScrollArea>
      )}
      <ButtonCreateRoom />
    </div>
  );
});
