import { observer } from 'mobx-react-lite';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { Player } from '@/routes/games/cryptoz/RoomPage/components/entites/Player';

export const Players = observer(function Players() {
  return (
    <div className="flex">
      {roomStore.room.players.map(player => (
        <Player {...player} key={player.nickname} />
      ))}
    </div>
  );
});
