import { observer } from 'mobx-react-lite';
import { ru } from 'date-fns/locale';
import { formatDistance } from 'date-fns/formatDistance';

import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';

export const RoomDescription = observer(function RoomDescription() {
  return roomsStore.currentRoom && (
    <>
      <span>
        Участники:
        {' '}
        {roomsStore.currentRoom.playerNicknames.join(', ')}
      </span>
      <span>
        Количество зрителей:
        {' '}
        {roomsStore.currentRoom.countViewers}
      </span>
      <span>
        Игра закончена:
        {' '}
        {roomsStore.currentRoom.isGameEnded ? 'Да' : 'Нет'}
      </span>
      <span>
        Игра началась:
        {' '}
        {roomsStore.currentRoom.isGameStarted ? 'Да' : 'Нет'}
      </span>
      {roomsStore.currentRoom.isGameStarted && roomsStore.currentRoom.startedAt && (
        <span>
          В игре:
          {' '}
          {formatDistance(
            roomsStore.currentRoom.endedAt ?? Date.now(),
            roomsStore.currentRoom.startedAt,
            { locale: ru },
          )}
        </span>
      )}
      <span className="text-lg text-foreground">Настройки</span>
      <span>
        Максимальное количество участников:
        {' '}
        {roomsStore.currentRoom.settings.maxPlayers}
      </span>
      <span>
        Максимальное количество карт на рынке:
        {' '}
        {roomsStore.currentRoom.settings.maxMarket}
      </span>
    </>
  );
});
