import { useDocumentTitle, useUnmount } from 'usehooks-ts';
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { CryptozShared } from '@trgames/shared';

import { analyticsService } from '@/services';
import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomsPage/services';
import { RoomList } from '@/routes/games/cryptoz/RoomsPage/components/Rooms';
import { RoomInfo } from '@/routes/games/cryptoz/RoomsPage/components/RoomInfo';
import { RoomFilters } from '@/routes/games/cryptoz/RoomsPage/components/RoomFilters';

export const Component = observer(function CryptozRoomListPage() {
  useDocumentTitle('Список комнат Криптоз');

  useEffect(() => {
    analyticsService.page(CryptozShared.EAnalyticsPage.ROOMS);
  }, []);

  useEffect(() => {
    socketService.connect();
  });

  useUnmount(() => {
    socketService.close();
    roomsStore.clear();
  });

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row">
      <div className="flex flex-col gap-4 sm:w-[250px] sm:max-w-[350px] lg:w-full">
        <RoomFilters />
        <RoomList />
      </div>
      <div className="hidden grow rounded-md border border-border p-2 shadow-md shadow-accent sm:flex sm:p-4">
        <RoomInfo />
      </div>
    </div>
  );
});
