import { observer } from 'mobx-react-lite';

import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { RoomFooter } from '@/routes/games/cryptoz/RoomsPage/components/RoomInfo/components/RoomFooter';
import { RoomDescription } from '@/routes/games/cryptoz/RoomsPage/components/RoomInfo/components/RoomDescription';

export const RoomInfo = observer(function RoomInfo() {
  return roomsStore.currentRoom && (
    <div className="flex w-full flex-col">
      <div className="mb-10 break-all text-xl">
        {roomsStore.currentRoom.name}
      </div>
      <div className="flex grow flex-col gap-4 text-card-foreground">
        <RoomDescription />
      </div>
      <div className="mt-6 contents flex-col gap-4 sm:flex">
        <RoomFooter />
      </div>
    </div>
  );
});
